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


@app.route("/")
def index():
    return render_template("index.html")

@app.route("/updategraphs", methods=["POST"])
def updategraphs():

    # Query for form data
    bundles = request.form.get("bundles")
    targetmargin = request.form.get("targetmargin")
    minpayout = request.form.get("minpayout")

    strikes = np.linspace(0,6000,13)
    policyid_list = []
    payouts_list = []
    premiums_list = []
    crit_thresh_list = []
    clsr_list = []
    premsaspc_list = []

    for strike in strikes:
        # Access pre-calculated payout and premium data from the database
        # (calculation of these values is too computationally intensive to run in the app)
        res = db.execute(f"""SELECT policyid, strike, payouts, premiums FROM policies WHERE strike={strike} AND minpayout={minpayout} AND bundles={bundles} AND targetmargin={targetmargin} ORDER BY strike""").fetchone()

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
                                           loandeposit=0.20,
                                           loaninterest=0.19,
                                           kg_per_mouth=180)

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

    res = db.execute(f"""SELECT strike, payouts, premiums FROM policies WHERE strike={clicked_strike} AND minpayout={minpayout} AND bundles={bundles} AND targetmargin={targetmargin} ORDER BY strike""").fetchone()

    payouts = pd.DataFrame(res.payouts).transpose()
    payouts.index = [int(x) for x in payouts.index]
    payouts = payouts.sort_index()

    premiums = pd.DataFrame(res.premiums).transpose()
    premiums.index = [int(x) for x in premiums.index]
    premiums = premiums.sort_index()

    # Calculate critical critloss DF and total_thresh
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


    heatmapdata = {"cl_noins": cl_noins.values.tolist(),
                   "cl_ins": cl_ins.values.tolist(),
                   "improvement": (cl_ins - cl_noins).values.tolist(),
                   "columns": cl_ins.columns.tolist(),
                   "index": cl_ins.index.tolist()}

    return jsonify(heatmapdata)
