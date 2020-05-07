import os

import pandas as pd
import numpy as np

from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker

import helpers

engine = create_engine(os.getenv("DATABASE_URL"))
db = scoped_session(sessionmaker(bind=engine))
# Could have used with engine.connect as connection:

def main():
    # Import data from csv
    data = pd.read_csv('data/data123.csv', header=0, index_col='siteid')

    # Pull out index yields and real yields into their own dataframes
    indcols = []
    realcols = []
    for col in data.columns:
        if col[:5] == "index":
            indcols.append(col)
        elif col[:4] == 'real':
            realcols.append(col)

    indexyields = data[indcols]
    realyields = data[realcols]

    # Create array of years and relabel the columns of indexyields and realyields
    years = [x[-4:] for x in indexyields.columns]
    indexyields.columns = years
    realyields.columns = years

    # Analyse combinations of insurance parameters at default crit loss
    # parameters and write results to the POLICIES table of the database

    # strike = 4000
    # bundle = 2
    maxpayout = 999999
    # targetmargin = 0.25

    strikes = np.linspace(0,6000,13)
    bundles = [0, 1 ,2, 3]
    minpayouts = [0, 500, 1000, 2000]
    targetmargins = [0, 0.1, 0.2, 0.3, 0.4, 0.5]

    loandeposits = [0, 0.5]   # [0, 0.2, 0.5, 1.0]
    loaninterests = [0.1, 0.2]   # [0.1, 0.2, 0.3]
    kg_per_mouths = [90, 180]   # [90, 180, 360]

    combinations = (len(strikes)
                    * len(bundles)
                    * len(minpayouts)
                    * len(targetmargins))
    counter = 1

    for strike in strikes:
        for bundle in bundles:
            for minpayout in minpayouts:
                for targetmargin in targetmargins:

                    payouts, premiums = helpers.calc_payouts_premiums(indexyields,
                                                      strikelevel=strike,
                                                      bundles=bundle,
                                                      minpayout=minpayout,
                                                      maxpayout=maxpayout,
                                                      targetmargin=targetmargin)

                    crit_thresh_df = helpers.calc_crit(data,
                                               indexyields,
                                               loandeposit=0.20,
                                               loaninterest=0.19,
                                               kg_per_mouth=180)

                    cl_noins, cl_ins, clsr, clcr, clfr, premsaspc, realisedmargin = helpers.evaluate(realyields,
                                                                     crit_thresh_df,
                                                                     payouts,
                                                                     premiums,
                                                                     data['farmarea'],
                                                                     startyear='1990')

                    payouts_json = payouts.to_json(orient='index')
                    premiums_json = premiums.to_json(orient='index')

                    db.execute("""INSERT INTO policies(strike, bundles, minpayout, maxpayout, targetmargin, realisedmargin, clsr, clcr, clfr, premsaspc, payouts, premiums)
                               VALUES (:strike, :bundle, :minpayout, :maxpayout, :targetmargin, :realisedmargin, :clsr, :clcr, :clfr, :premsaspc, :payouts, :premiums);""",
                               {"strike": strike,
                                "bundle": bundle,
                                "minpayout": minpayout,
                                "maxpayout": maxpayout,
                                "targetmargin": targetmargin,
                                "realisedmargin": realisedmargin,
                                "clsr": clsr,
                                "clcr": clcr,
                                "clfr": clfr,
                                "premsaspc": premsaspc,
                                "payouts": payouts_json,
                                "premiums": premiums_json})

                    print(f"Added {counter} of {combinations}")
                    counter += 1

    db.commit()




    # db.execute("""INSERT INTO policies""")

        # Write these to the POLICIES table of the database
        # policyid
        # strike
        # bundles
        # minpayout
        # maxpayout
        # clsr
        # clcr
        # clfr
        # payouts
        # premiums


if __name__ == "__main__":
    main()
