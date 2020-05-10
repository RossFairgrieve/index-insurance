from flask import Flask, jsonify, render_template, request
import requests
import os
import json
import numpy as np
import pandas as pd
import helpers

from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker

app = Flask(__name__, template_folder='./templates', static_folder="./static")

engine = create_engine(os.getenv("DATABASE_URL"))
db = scoped_session(sessionmaker(bind=engine))

# Import data from csv
data = pd.read_csv('data/data84.csv', header=0, index_col='siteid')

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


@app.route("/")
def index():
    return render_template("index.html",
                           regions = data['group'].unique()
                           )

@app.route("/updategraphs", methods=["POST"])
def updategraphs():

    # Query for form data
    bundles = request.form.get("bundles")
    targetmargin = request.form.get("targetmargin")
    minpayout = request.form.get("minpayout")
    maxpayout = request.form.get("maxpayout")
    kgperperson = int(request.form.get("kgperperson"))
    interest = float(request.form.get("interest"))
    deposit = float(request.form.get("deposit"))

    strikes = np.linspace(0,6000,13)
    policyid_list = []
    payouts_list = []
    premiums_list = []
    crit_thresh_list = []
    clsr_list = []
    premsaspc_list = []

    for strike in strikes:
        strike = int(strike)
        # Access pre-calculated payout and premium data from the database
        # (calculation of these values is too computationally intensive to run in the app)
        res = db.execute(f"""SELECT policyid, strike, payouts, premiums FROM policies WHERE strike={strike} AND minpayout={minpayout} AND maxpayout={maxpayout} AND bundles={bundles} AND targetmargin={targetmargin} ORDER BY strike""").fetchone()

        policyid_list.append(res.policyid)

        payouts = pd.DataFrame(res.payouts).transpose()
        payouts.index = [int(x) for x in payouts.index]
        payouts = payouts.sort_index()

        premiums = pd.DataFrame(res.premiums).transpose()
        premiums.index = [int(x) for x in premiums.index]
        premiums = premiums.sort_index()

        # Calculate critical critloss DF and total_thresh
        crit_thresh_df = helpers.calc_crit(data,
                                           indexyields,
                                           loandeposit=deposit,
                                           loaninterest=interest,
                                           kg_per_mouth=kgperperson)

        cl_noins, cl_ins, clsr, clcr, clfr, premsaspc, realisedmargin = helpers.evaluate(realyields,
                                                         crit_thresh_df,
                                                         payouts,
                                                         premiums,
                                                         data['farmarea'],
                                                         startyear='1990')

        clsr_list.append(clsr)
        premsaspc_list.append(premsaspc)

    datadict = {"strikes": strikes.tolist(),
                "clsr_list": clsr_list,
                "premsaspc_list": premsaspc_list,
                "policyid_list": policyid_list}

    return jsonify(datadict)

@app.route("/heatmap", methods=["POST"])
def heatmap():
    clicked_strike = request.form.get("strike")

    bundles = request.form.get("bundles")
    targetmargin = request.form.get("targetmargin")
    minpayout = request.form.get("minpayout")
    maxpayout = request.form.get("maxpayout")
    kgperperson = int(request.form.get("kgperperson"))
    interest = float(request.form.get("interest"))
    deposit = float(request.form.get("deposit"))

    region = request.form.get("region")

    res = db.execute(f"""SELECT strike, payouts, premiums FROM policies WHERE strike={clicked_strike} AND minpayout={minpayout} AND maxpayout={maxpayout} AND bundles={bundles} AND targetmargin={targetmargin} ORDER BY strike""").fetchone()

    payouts = pd.DataFrame(res.payouts).transpose()
    payouts.index = [int(x) for x in payouts.index]
    payouts = payouts.sort_index()

    premiums = pd.DataFrame(res.premiums).transpose()
    premiums.index = [int(x) for x in premiums.index]
    premiums = premiums.sort_index()

    # Calculate critical critloss DF and total_thresh
    crit_thresh_df = helpers.calc_crit(data,
                                       indexyields,
                                       loandeposit=deposit,
                                       loaninterest=interest,
                                       kg_per_mouth=kgperperson)

    cl_noins, cl_ins, clsr, clcr, clfr, premsaspc, realisedmargin = helpers.evaluate(realyields,
                                                     crit_thresh_df,
                                                     payouts,
                                                     premiums,
                                                     data['farmarea'],
                                                     startyear='1990')

    min_cl = cl_noins.min().min()

    cl_ins = cl_ins.sort_index(ascending=False)
    cl_noins = cl_noins.sort_index(ascending=False)
    indexyieldstosend = indexyields.sort_index(ascending=False)

    if region != "All":
        cl_noins = cl_noins[:][data['group'] == region]
        cl_ins = cl_ins[:][data['group'] == region]
        indexyieldstosend = indexyieldstosend[:][data['group'] == region]
        regions = [region] * cl_ins.shape[0]
    else:
        regions = data['group'].sort_index(ascending=False).tolist()

    improvement =  (cl_ins - cl_noins)

    sitenames = []
    for i in range(1, cl_ins.index.size +1):
        sitenames.append(" " * i)

    heatmapdata = {"cl_noins": cl_noins.values.tolist(),
                   "cl_ins": cl_ins.values.tolist(),
                   "improvement": improvement.values.tolist(),
                   "columns": cl_ins.columns.tolist(),
                   "sitenames": sitenames,
                   "regions": regions,
                   "min_cl": min_cl,
                   "indexyields": indexyieldstosend.values.tolist()
                   }

    return jsonify(heatmapdata)


@app.route("/blankheatmaps", methods=["POST"])
def blankheatmaps():
    region = request.form.get("region")

    zeros = pd.DataFrame(np.zeros((indexyields.shape[0], indexyields.shape[1])),
                         index=indexyields.index,
                         columns=indexyields.columns)
    zeros = zeros.sort_index(ascending=False)

    if region != "All":
        zeros = zeros[:][data['group'] == region]
        regions = [region] * cl_ins.shape[0]
    else:
        regions = data['group'].sort_index(ascending=False).tolist()

    sitenames = []
    for i in range(1, zeros.index.size +1):
        sitenames.append(" " * i)

    blankheatmapdata = {"zeros": zeros.values.tolist(),
                   "columns": zeros.columns.tolist(),
                   "sitenames": sitenames,
                   "regions": regions
                   }

    return jsonify(blankheatmapdata)
