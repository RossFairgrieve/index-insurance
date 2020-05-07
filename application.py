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
# Could have used with engine.connect as connection:

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/convert", methods=["POST"])
def convert():

    # Query for currency exchange rate
    bundles = request.form.get("bundles")
    targetmargin = request.form.get("targetmargin")
    minpayout = request.form.get("minpayout")

    results = db.execute(f"""SELECT strike, clsr, premsaspc, policyid FROM policies WHERE minpayout={minpayout} AND bundles={bundles} AND targetmargin={targetmargin} ORDER BY strike""").fetchall()

    strikes= [row.strike for row in results]
    clsr = [row.clsr*100 for row in results]
    premsaspc = [row.premsaspc*100 for row in results]
    policyids = [row.policyid for row in results]

    data={"strikes": strikes,
          "clsr": clsr,
          "premsaspc": premsaspc,
          "policyids": policyids}

    datajson = jsonify(data)

    return datajson

@app.route("/policies/<policyid>", methods=["GET", "POST"])
def policy(policyid):

    results = db.execute(f"""SELECT payouts, premiums, strike, bundles, targetmargin, minpayout FROM policies WHERE policyid={policyid}""").fetchone()

    payouts = pd.DataFrame(results.payouts).transpose()
    payouts.index = [int(x) for x in payouts.index]
    payouts = payouts.sort_index()

    premiums = pd.DataFrame(results.premiums).transpose()
    premiums.index = [int(x) for x in premiums.index]
    premiums = premiums.sort_index()

    strike = results.strike
    bundles = results.bundles
    targetmargin = results.targetmargin
    minpayout = results.minpayout


    # payouts= [x[0] for x in results]
    # premiums = [x[1] for x in results]
    # strike = [x[2] for x in results]
    # bundles = [x[3] for x in results]
    # minpayout = [x[4] for x in results]
    # targetmargin = [x[5] for x in results]

    return f"{strike}"
