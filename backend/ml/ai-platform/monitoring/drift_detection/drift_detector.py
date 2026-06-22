import numpy as np
from dataclasses import dataclass
from datetime import datetime
from typing import Optional
from scipy.stats import ks_2samp, wasserstein_distance as scipy_wasserstein
from config import settings
from model_registry.registry import registry


@dataclass
class FeatureDrift:
    feature_name: str
    psi: float
    kl_divergence: float
    js_divergence: float
    ks_statistic: float
    ks_p_value: float
    wasserstein: float
    drift_detected: bool
    severity: str          # none | minor | significant | critical


@dataclass
class DriftReport:
    model_name: str
    drift_detected: bool
    drifted_features: list[str]
    feature_drift: list[FeatureDrift]
    overall_severity: str
    recommendation: str
    assessed_at: str


def _psi(reference: np.ndarray, current: np.ndarray, bins: int = 10) -> float:
    """Population Stability Index. >0.2 = significant distributional shift."""
    lo = min(reference.min(), current.min())
    hi = max(reference.max(), current.max())
    if lo == hi:
        return 0.0
    edges = np.linspace(lo, hi, bins + 1)
    eps = 1e-8
    ref_p = (np.histogram(reference, bins=edges)[0] + eps) / (len(reference) + eps * bins)
    cur_p = (np.histogram(current,   bins=edges)[0] + eps) / (len(current)   + eps * bins)
    return float(np.sum((cur_p - ref_p) * np.log(cur_p / ref_p)))


def _kl(p_arr: np.ndarray, q_arr: np.ndarray, bins: int = 10) -> float:
    lo = min(p_arr.min(), q_arr.min())
    hi = max(p_arr.max(), q_arr.max())
    if lo == hi:
        return 0.0
    edges = np.linspace(lo, hi, bins + 1)
    p = np.histogram(p_arr, bins=edges, density=True)[0].astype(float) + 1e-10
    q = np.histogram(q_arr, bins=edges, density=True)[0].astype(float) + 1e-10
    p /= p.sum(); q /= q.sum()
    return float(np.sum(p * np.log(p / q)))


def _js(p_arr: np.ndarray, q_arr: np.ndarray, bins: int = 10) -> float:
    """Jensen-Shannon divergence. Symmetric, bounded [0, 1]."""
    lo = min(p_arr.min(), q_arr.min())
    hi = max(p_arr.max(), q_arr.max())
    if lo == hi:
        return 0.0
    edges = np.linspace(lo, hi, bins + 1)
    p = np.histogram(p_arr, bins=edges, density=True)[0].astype(float) + 1e-10
    q = np.histogram(q_arr, bins=edges, density=True)[0].astype(float) + 1e-10
    p /= p.sum(); q /= q.sum()
    m = 0.5 * (p + q)
    return float(0.5 * np.sum(p * np.log(p / m)) + 0.5 * np.sum(q * np.log(q / m)))


def _severity(psi_val: float) -> str:
    if psi_val >= 0.4:  return "critical"
    if psi_val >= 0.2:  return "significant"
    if psi_val >= 0.1:  return "minor"
    return "none"


def detect_drift(
    model_name: str,
    reference_data: dict[str, np.ndarray],
    current_data: dict[str, np.ndarray],
    window_start: Optional[str] = None,
    window_end: Optional[str] = None,
    log_to_registry: bool = True,
) -> DriftReport:
    now = datetime.utcnow().isoformat()
    ws  = window_start or now
    we  = window_end   or now

    feature_drifts: list[FeatureDrift] = []

    for feat in reference_data:
        if feat not in current_data:
            continue
        ref = np.array(reference_data[feat], dtype=float)
        cur = np.array(current_data[feat],   dtype=float)
        if len(ref) < 10 or len(cur) < 10:
            continue

        psi_val = _psi(ref, cur)
        kl_val  = _kl(ref, cur)
        js_val  = _js(ref, cur)
        ks, kp  = ks_2samp(ref, cur)
        wd      = float(scipy_wasserstein(ref, cur))

        drift    = psi_val >= settings.PSI_THRESHOLD
        severity = _severity(psi_val)

        feature_drifts.append(FeatureDrift(
            feature_name=feat,
            psi=round(psi_val, 6),
            kl_divergence=round(kl_val, 6),
            js_divergence=round(js_val, 6),
            ks_statistic=round(float(ks), 6),
            ks_p_value=round(float(kp), 6),
            wasserstein=round(wd, 6),
            drift_detected=drift,
            severity=severity,
        ))

        if log_to_registry:
            registry.log_drift(model_name, feat, psi_val, kl_val, js_val, drift, ws, we)

    drifted = [fd.feature_name for fd in feature_drifts if fd.drift_detected]
    overall = bool(drifted)

    if any(fd.severity == "critical"    for fd in feature_drifts): sev = "critical"
    elif any(fd.severity == "significant" for fd in feature_drifts): sev = "significant"
    elif drifted:                                                      sev = "minor"
    else:                                                              sev = "none"

    recs = {
        "critical":    "IMMEDIATE_RETRAIN: Critical distributional shift — model accuracy likely degraded.",
        "significant": "SCHEDULE_RETRAIN: Significant drift detected. Retrain within 24 hours.",
        "minor":       "MONITOR: Minor drift. Continue monitoring; retrain if trend persists.",
        "none":        "STABLE: No feature drift detected.",
    }

    return DriftReport(
        model_name=model_name,
        drift_detected=overall,
        drifted_features=drifted,
        feature_drift=feature_drifts,
        overall_severity=sev,
        recommendation=recs[sev],
        assessed_at=now,
    )
