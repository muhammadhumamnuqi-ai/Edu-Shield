import sys
import json
import joblib
import numpy as np
import pandas as pd

model_data = joblib.load('ml/model.pkl')
model = model_data['model']
label_encoders = model_data['label_encoders']
feature_cols = model_data['feature_cols']
classes = model_data['classes']

def predict(input_data):
    df = pd.DataFrame([input_data])

    for col in feature_cols:
        val = df[col].astype(str)
        le = label_encoders.get(col)
        if le:
            known = list(le.classes_)
            fallback = 'Unknown' if 'Unknown' in known else known[0]
            df[col] = val.apply(lambda x: x if x in known else fallback)
            df[col] = le.transform(df[col].astype(str))

    prediction = model.predict(df[feature_cols])[0]
    proba = model.predict_proba(df[feature_cols])[0]

    risk_score = float(proba[1])
    risk_level = 'High' if risk_score >= 0.6 else ('Medium' if risk_score >= 0.3 else 'Low')

    feature_imp = dict(zip(feature_cols, model.feature_importances_))
    risk_factors = sorted(
        [{'factor': f.replace('_', ' ').title(), 'importance': float(v)} for f, v in feature_imp.items()],
        key=lambda x: x['importance'], reverse=True
    )

    return {
        'prediction': classes[prediction],
        'risk_score': risk_score,
        'risk_level': risk_level,
        'risk_factors': risk_factors[:5]
    }

if __name__ == '__main__':
    input_json = sys.stdin.read()
    input_data = json.loads(input_json)
    result = predict(input_data)
    print(json.dumps(result))
