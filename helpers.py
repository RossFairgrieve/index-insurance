import pandas as pd
import numpy as np

# Define functions for calculating rolling mean and SD of yield at each site
# (used later)
def rollingmean(row):
    rolling = []
    for i in range(len(row)):
        rolling.append(row.iloc[0:i+1].mean())

    return pd.Series(rolling, index=row.index)

def rollingstd(row):
    rolling = [0]
    for i in range(1,len(row)):
        rolling.append(row.iloc[0:i+1].std(ddof=0))

    return pd.Series(rolling, index=row.index)


# Define function for labelling bundles based on rolling mean and SD
def label_bundles(df, bundles=2):

    rolling_means = df.apply(rollingmean, axis=1)
    rolling_stds = df.apply(rollingstd, axis=1)

    labels_mean = []
    for column in rolling_means:
        column_labels = pd.qcut(rolling_means[column], bundles, labels=np.arange(1,bundles+1))
        labels_mean.append(pd.qcut(rolling_means[column], bundles, labels=np.arange(1,bundles+1)))

    labels_std = []
    for column in rolling_means:
        if column == df.columns[0]:
            labels_std.append(rolling_stds[column])
        else:
            labels_std.append(pd.qcut(rolling_stds[column], bundles, labels=np.arange(1,bundles+1)))

    return pd.DataFrame(labels_mean).transpose(), pd.DataFrame(labels_std).transpose().astype('int32')


def bundle_adjust(premiums_df, mean_bundles_df, std_bundles_df, bundles):

    labels = np.arange(1,bundles+1)
    bundles_dict = {}
    bundled_premiums = pd.DataFrame(index=premiums_df.index, columns=premiums_df.columns)

    for m in labels:
        for s in labels:
            for y in premiums_df.columns:
                bundles_dict[f"{m}-{s}-{y}"] = premiums_df[(mean_bundles_df == m) & (std_bundles_df == s)].mean().loc[y]

    for j in range(premiums_df.shape[1]):
        for i in range(premiums_df.shape[0]):
            if j == 0:
                bundled_premiums.iloc[i,j] = 0
            else:
                bundled_premiums.iloc[i,j] = bundles_dict[f"{mean_bundles_df.iloc[i,j]}-{std_bundles_df.iloc[i,j]}-{premiums_df.columns[j]}"]
    return bundled_premiums


# Define function for calculating cost of insurance based on historical payouts
def calc_payouts_premiums(df, strikelevel, calcmethod="hpayouts", payoutfunction="linear", minpayout=0, maxpayout=99999, targetmargin=0.25, bundles=0):

    payouts = []

    for ind, row in df.iterrows():

        payouts_row = []

        for i in range(len(row)):
            if row[i] < strikelevel - minpayout:
                if payoutfunction == "linear":
                    payouts_row.append(min(strikelevel-row[i], maxpayout))
                elif payoutfunction == "exponential":
                    # TODO
                    payouts_row.append(min(strikelevel-row[i], maxpayout))
                elif payoutfunction == "sigmoidal":
                    # TODO
                    payouts_row.append(min(strikelevel-row[i], maxpayout))
            else:
                payouts_row.append(0)

        payouts.append(payouts_row)

    payouts = pd.DataFrame(payouts, index=df.index, columns=df.columns)

    # Calculate premiums
    af_premiums = []

    for ind, row in payouts.iterrows():

        af_premiums_row = [0]

        for i in range(1, len(row)):
            af_premiums_row.append( sum(row[0:i])/i )

        af_premiums.append(af_premiums_row)

    af_premiums = pd.DataFrame(af_premiums, index=df.index, columns=df.columns)
    loaded_premiums = af_premiums * (1 + targetmargin)

    if bundles == 0:
        return payouts, loaded_premiums
    else:
        mean_bundle_labels, std_bundle_labels = label_bundles(df, bundles=bundles)
        bundled_premiums = bundle_adjust(loaded_premiums, mean_bundle_labels, std_bundle_labels, bundles=bundles)
        return payouts, bundled_premiums


# Define function for calculating critical threshold yields, below which
# livelihoods are in jeopardy
def calc_crit(data, indexyields, loandeposit=0.20, loaninterest=0.19, kg_per_mouth=180):

    critthresh_df = []

    for i in range(0, data.shape[0]):

        # Calculate minimum yield required to give all members of household the
        # minimum required crop for subsistence
        min_yield = (kg_per_mouth * data['householdsize'][i]) / data['farmarea'][i]

        # Calculate cost of agricultural inputs including any loan interest payments
        inputcost_yield = data["inputcost"][i] / data["cropprice"][i]
        deposit = inputcost_yield * loandeposit
        loanamount = inputcost_yield - deposit
        totalinputcost = (loanamount * (1 + loaninterest)) + deposit
        total_thresh = min_yield + totalinputcost

        # Critical threshold required is the minimum yield that allows for
        # susbsistence and payment of input costs:
        critthresh_df.append(total_thresh)
    critthresh_df = [critthresh_df] * indexyields.shape[1]

    return pd.DataFrame(critthresh_df, index=indexyields.columns, columns=indexyields.index).transpose()


# Define function for analysing the performance of a given insurance instrument
def evaluate(realyields_df, critthresh_df, payouts_df, premiums_df, farmarea_series, startyear='1990'):

    # Calculate DF of critical loss at each farm in each year
    # with no insurance in place
    critloss_df_noins = (realyields_df.loc[:, startyear:]
                         - critthresh_df.loc[:, startyear:])
    critloss_df_noins = critloss_df_noins.applymap(lambda x: min(x,0))
    critloss_df_noins = critloss_df_noins.multiply(farmarea_series, axis=0)

    # Calculate DF of critical loss at each farm in each year
    # with insurance in place
    critloss_df_ins = (realyields_df.loc[:, startyear:]
                       + payouts_df.loc[:, startyear:]
                       - premiums_df.loc[:, startyear:]
                       - critthresh_df.loc[:, startyear:])
    critloss_df_ins = critloss_df_ins.applymap(lambda x: min(x,0))
    critloss_df_ins = critloss_df_ins.multiply(farmarea_series, axis=0)

    # Calculate reduction in total critical loss
    critloss_sum_red = 100 * (1 - (critloss_df_ins.sum().sum() / critloss_df_noins.sum().sum()))

    # Calculate reduction in individual instances of critical loss
    critloss_count_red = 100 * (1 - (critloss_df_ins[critloss_df_ins < 0].count().sum() / critloss_df_noins[critloss_df_noins < 0].count().sum()))

    # Calculate reduction in number of farms experiencing critical loss
    # in at least one year over the insured period
    critloss_farms_ins = critloss_df_ins[critloss_df_ins < 0].count(axis=1)[critloss_df_ins[critloss_df_ins < 0].count(axis=1)>0].count()
    critloss_farms_noins = critloss_df_noins[critloss_df_noins < 0].count(axis=1)[critloss_df_noins[critloss_df_noins < 0].count(axis=1)>0].count()
    critloss_farms_red = 100 * (1 - (critloss_farms_ins / critloss_farms_noins))

    # Calculate the avergae cost of premiums as a percentage of annual harvest
    prems_as_pc = 100 * ((premiums_df.loc[:,startyear:].mean(axis=1) / realyields_df.loc[:,startyear:].mean(axis=1)).mean())

    # Calculate insurer margin over all sites and years
    total_payouts = (payouts_df.loc[:, startyear:].sum(axis=1) * farmarea_series).sum()
    total_premiums = (premiums_df.loc[:, startyear:].sum(axis=1) * farmarea_series).sum()

    if total_payouts == 0 and total_premiums == 0:
        realised_margin = 0
    else:
        realised_margin = ((total_premiums / total_payouts)-1)

    return critloss_df_noins, critloss_df_ins, critloss_sum_red, critloss_count_red, critloss_farms_red, prems_as_pc, realised_margin
