# rl_client.py
import requests
import time

BASE = "http://localhost:8000"

def request_action(state):
    resp = requests.post(f"{BASE}/rl/action", json={"state": state})
    resp.raise_for_status()
    return resp.json()["action"], resp.json().get("model_version")

def push_experience(state, action, reward, next_state, done):
    payload = {
        "state": state,
        "action": action,
        "reward": reward,
        "next_state": next_state,
        "done": done
    }
    r = requests.post(f"{BASE}/rl/experience", json=payload)
    r.raise_for_status()
    return r.json()

def main_loop():
    # Example loop (replace with real env)
    state = {"soil_moisture": 0.2, "crop_stage": "vegetative", "price": 20.0}
    for step in range(100):
        action, version = request_action(state)
        # execute action in your simulator or in-field controller
        # here we simulate a result:
        # next_state will change due to action
        next_state = {"soil_moisture": min(1.0, state["soil_moisture"] + 0.1)}
        # example reward: higher crop yield / saved water / better price
        reward = 1.0  # compute using your reward function
        done = False
        r = push_experience(state, action, reward, next_state, done)
        print("pushed experience:", r)
        state = next_state
        time.sleep(0.5)

if __name__ == "__main__":
    main_loop()
