// src/lib/scenarioData.ts
// Scenario database for Scenario Mode
// Ported from legacy/js/scenario.js

/**
 * A scenario question with real-world context
 */
export interface ScenarioQuestion {
	/** Short title for the scenario (e.g., "Door Access") */
	title: string;
	/** The narrative/story describing the real-world situation */
	scenario: string;
	/** Variable meanings - maps each input variable to its real-world meaning */
	inputs: Record<string, string>;
	/** The Boolean expression that solves the scenario */
	expression: string;
}

/**
 * Scenario database organized by difficulty level
 * Level 1: Simple AND/OR scenarios (1-2 inputs)
 * Level 2: More complex scenarios (3-4 inputs with grouping)
 * Level 3: Wordy real-world scenarios (requires careful reading)
 * Level 4: A-Level scenarios (XOR gates, complex logic)
 */
export const scenarioDatabase: Record<number, ScenarioQuestion[]> = {
	1: [
		// Level 1 - Simple AND/OR scenarios
		{
			title: "Going out",
			scenario: "You can go out (Q) if you have done your homework.",
			inputs: {
				A: "Homework is done",
			},
			expression: "Q = A",
		},
		{
			title: "Going out again",
			scenario: "You can go out (Q) if you did not get a detention at school.",
			inputs: {
				A: "Got a detention",
			},
			expression: "Q = NOT A",
		},
		{
			title: "Door Access",
			scenario:
				"A secure door will only unlock (Q) if the person has a valid ID badge AND knows the correct passcode.",
			inputs: {
				A: "Person has a valid ID badge",
				B: "Person knows the correct passcode",
			},
			expression: "Q = A AND B",
		},
		{
			title: "Alarm System",
			scenario:
				"A burglar alarm will trigger (Q) if either a door OR window is opened.",
			inputs: {
				A: "Door is opened",
				B: "Window is opened",
			},
			expression: "Q = A OR B",
		},
		{
			title: "Computer Login",
			scenario:
				"A computer will let the user login (Q) if they enter the correct username AND the correct password.",
			inputs: {
				A: "Correct username entered",
				B: "Correct password entered",
			},
			expression: "Q = A AND B",
		},
		{
			title: "Emergency Exit",
			scenario:
				"An emergency exit will open (Q) if either the fire alarm is activated OR the manual override is pressed.",
			inputs: {
				A: "Fire alarm is activated",
				B: "Manual override is pressed",
			},
			expression: "Q = A OR B",
		},
	],
	2: [
		// Level 2 - More complex scenarios with 3-4 inputs
		{
			title: "Bank Vault Access",
			scenario:
				"A bank stores its money in a vault to keep it safe. The vault will open (Q) only if all three conditions are met: the manager's key is turned, the correct code is entered, and biometric scan passes.",
			inputs: {
				A: "Manager's key is turned",
				B: "Correct code is entered",
				C: "Biometric scan passes",
			},
			expression: "Q = A AND B AND C",
		},
		{
			title: "Emergency Shutdown",
			scenario:
				"A nuclear reactor will shut down (Q) if the temperature or pressure exceed a safe limit. It can also be triggered by an emergency button being pressed.",
			inputs: {
				A: "Temperature exceeds safe limit",
				B: "Pressure exceeds safe limit",
				C: "Emergency button is pressed",
			},
			expression: "Q = A OR B OR C",
		},
		{
			title: "Car Engine Start",
			scenario:
				"A car engine will start (Q) if the key is in the ignition while the brake pedal is pressed or the start button is pressed.",
			inputs: {
				A: "Key is in ignition",
				B: "Brake pedal is pressed",
				C: "Start button is pressed",
			},
			expression: "Q = A AND (B OR C)",
		},
		{
			title: "Security Camera",
			scenario:
				"A security camera will record (Q) if motion is detected at night or the manual recording switch is on.",
			inputs: {
				A: "Motion is detected",
				B: "It's nighttime",
				C: "Manual recording switch is on",
			},
			expression: "Q = (A AND B) OR C",
		},
		{
			title: "Home assistant",
			scenario:
				"A home assistant will activate (Q) if it detects a voice command and Do Not Disturb is not enabled.",
			inputs: {
				A: "Voice command is detected",
				B: "Do Not Disturb is enabled",
			},
			expression: "Q = A AND NOT B",
		},
		{
			title: "Gym Access",
			scenario:
				"A gym grants access to discounted memberships (Q) only if one of the following applies: The person is under 21 and has a university ID, or they are aged 65 or older and show proof of residency.",
			inputs: {
				A: "Under 21",
				B: "Has university ID",
				C: "65 or older",
				D: "Has proof of residency",
			},
			expression: "Q = (A AND B) OR (C AND D)",
		},
		{
			title: "Library Bonus",
			scenario:
				"A library gives out a free bookmark (Q) when a special token is shown while borrowing either a fiction book or a non-fiction book.",
			inputs: {
				T: "Token is shown",
				F: "Fiction book borrowed",
				N: "Non-fiction book borrowed",
			},
			expression: "Q = T AND (F OR N)",
		},
	],
	3: [
		// Level 3 - More wordy scenarios
		{
			title: "Server Access Control",
			scenario:
				"A server will let a user login (Q) if they are authenticated. Admins can login whenever but regular users can only login during business hours.",
			inputs: {
				A: "User is authenticated",
				B: "User is an admin",
				C: "User is a regular user",
				D: "It's during business hours",
			},
			expression: "Q = A AND (B OR (C AND D))",
		},
		{
			title: "Smart doorbell",
			scenario: `Smart doorbells allow people to answer their door remotely. This means the user can talk to their visitors while they are not at home, or if they are unable to answer the door in person for any other reason, such as a disability.

Smart doorbells include a camera in addition to a doorbell. If the camera detects movement, or if the doorbell is pressed, then a notification is sent to the user's smartphone (X). An app can then be used to view the camera and to listen to or speak with the visitor.`,
			inputs: {
				D: "Doorbell is pressed",
				M: "Movement is detected by the camera",
			},
			expression: "X = M OR D",
		},
		{
			title: "Private Collector's Trap",
			scenario: `A private collector has received a valuable gemstone which they wish to put on display. Due to its value, the collector has proposed a trap to prevent thieves from stealing the gemstone or escaping after attempting to steal it.

The gemstone rests on top of a pressure plate on a pedestal, surrounded by a glass case. If the glass is broken and the gemstone's weight is removed from the pressure plate, the trap is set off. A steel barrier is then lowered (L), blocking the only entrance to the room and trapping any thieves.`,
			inputs: {
				B: "Glass case is broken",
				W: "Weight is applied",
			},
			expression: "L = B AND (NOT W)",
		},
		{
			title: "Bank Vault Lock",
			scenario: `Bank vaults use many different types of locks to prevent theft and unauthorised access. One bank improves its security by controlling the combination lock with an electronic system, allowing the combination lock to be enabled and disabled electronically. While disabled, the vault will not open even if the correct combination is used.

The combination lock is enabled (L) when two switches, located in separate rooms, are pressed. Additionally, to prevent access outside of the bank's opening hours even if the combination has been stolen, a time lock is used. This means that the combination lock is only enabled while the time lock is off as well.`,
			inputs: {
				A: "Switch 1 is pressed",
				B: "Switch 2 is pressed",
				T: "Time lock is on",
			},
			expression: "L = (A AND B) AND (NOT T)",
		},
		{
			title: "Synchronised Defibrillator",
			scenario: `Defibrillators are life-saving devices which apply an electric shock to a patient to return their heartbeat to normal. In some cases, this shock must be applied at a specific time (i.e. the shock must be synchronised with the patient's heartbeat).

When this is the case, the paddles are placed on the patient's chest and their heartbeat is monitored. Once a timing function has determined the correct moment to apply the shock, the user pushes a button on each paddle. The shock is then automatically applied (S) at the appropriate time to correct the patient's heartbeat.`,
			inputs: {
				A: "Button on paddle 1 is not pressed",
				B: "Button on paddle 2 is not pressed",
				T: "Timing function is ready",
			},
			expression: "S = NOT (A AND B) AND T",
		},
		{
			title: "Flood Predictor",
			scenario: `Flooding can be predicted ahead of time, allowing those who may be affected to set up defences or to evacuate. A simple prediction uses the amount of rainfall, as well as other conditions such as river stage (the water level in the river) and soil moisture, to determine whether a flood is likely to occur.

If the river stage is high, it may be close to overflowing, while if the soil moisture is high, it is unable to hold more water. High rainfall at the same time as either of these would then cause flooding (F). A prediction should therefore be made in these conditions.`,
			inputs: {
				M: "Soil moisture is high",
				R: "High rainfall",
				S: "River stage is high",
			},
			expression: "F = R AND (M OR S)",
		},
		{
			title: "Eco-Friendly Reward",
			scenario:
				"Shoppers receive a free reusable bag (Q) if their entire purchase is environmentally friendly. They must choose a reusable item (like a bamboo toothbrush or a metal straw), select organic food, and avoid plastic packaging.",
			inputs: {
				B: "Chosen bamboo toothbrush",
				F: "Chosen organic fruit",
				P: "Used plastic packaging",
				S: "Chosen metal straw",
			},
			expression: "Q = (B OR S) AND F AND (NOT P)",
		},
	],
	4: [
		// Level 4 - A-Level scenarios
		{
			title: "Half adder - sum",
			scenario:
				"Think through the logic of a half adder. What is the sum (S) output when adding two binary digits A and B?",
			inputs: {
				A: "Input A is 1",
				B: "Input B is 1",
			},
			expression: "S = A XOR B",
		},
		{
			title: "Half adder - carry",
			scenario:
				"Think through the logic of a half adder. What is the carry (C) output when adding two binary digits A and B?",
			inputs: {
				A: "Input A is 1",
				B: "Input B is 1",
			},
			expression: "C = A AND B",
		},
		{
			title: "Full adder - sum",
			scenario:
				"The sum (S) of a full adder is 1 if an odd number of the inputs are 1. This means either A or B are 1 (but not both) while the carry-in (C) is 1, or if A and B are both 1 (but not C).",
			inputs: {
				A: "Input A is 1",
				B: "Input B is 1",
				C: "Carry-in is 1",
			},
			expression: "S = (A XOR B) XOR C",
		},
		{
			title: "Full adder - carry out",
			scenario:
				"A full adder is used to perform binary addition. The carry-out (C)is 1 if there's a carry from the addition. This occurs when either A and B are both 1 or when the carry-in is 1 and either A or B is 1 (but not both).",
			inputs: {
				A: "Input A is 1",
				B: "Input B is 1",
				C: "Carry-in is 1",
			},
			expression: "C = ((A XOR B) AND C) OR (A AND B)",
		},
		{
			title: "Burglar Alarms - Revisited",
			scenario: `An alarm is made up of a noise sensor and a motion sensor. When the alarm is set, it will trigger (Q) if either of the sensors detect movement.
The alarm has a test mode which can be used to check that the sensors are working without triggering the alarm. When in test mode, the alarm will not trigger even if the sensors detect movement.`,
			inputs: {
				N: "Noise sensor is triggered",
				M: "Motion sensor is triggered",
				S: "Alarm is set",
				T: "Alarm is in test mode",
			},
			expression: "Q = S AND (N OR M) AND (NOT T)",
		},
		{
			title: "Computer Login with 2FA",
			scenario:
				"To make a system more secure, the admin enabled 2FA. The system will let the user login (Q) by replying to either a push notification or an SMS.",
			inputs: {
				U: "Correct username entered",
				P: "Correct password entered",
				N: "Replied to push notification",
				S: "Replied to SMS",
			},
			expression: "Q = U AND P AND (N OR S)",
		},
		{
			title: "Free food",
			scenario:
				"A shop gives out a free snack (S) when a coupon is handed in while buying a hot chocolate or a tea.",
			inputs: {
				C: "Coupon is handed in",
				H: "Hot chocolate is bought",
				T: "Tea is bought",
			},
			expression: "S = C AND (H OR T)",
		},
	],
};

/**
 * Get all scenarios for a specific difficulty level
 */
export function getScenariosForLevel(level: number): ScenarioQuestion[] {
	return scenarioDatabase[level] || [];
}

/**
 * Get a random scenario for a specific difficulty level
 */
export function getRandomScenario(level: number): ScenarioQuestion | null {
	const scenarios = getScenariosForLevel(level);
	if (scenarios.length === 0) return null;

	const randomIndex = Math.floor(Math.random() * scenarios.length);
	return scenarios[randomIndex];
}
