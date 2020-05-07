from flask import Flask, jsonify, render_template, request
import requests
import os
import json
import numpy as np
import pandas as pd

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

    strikes= [x[0] for x in results]
    clsr = [x[1]*100 for x in results]
    premsaspc = [x[2]*100 for x in results]
    policyids = [x[3] for x in results]

    data={"strikes": strikes,
          "clsr": clsr,
          "premsaspc": premsaspc,
          "policyids": policyids}

    datajson = jsonify(data)

    return datajson
