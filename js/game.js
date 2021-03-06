async function restartGame() {
	if (confirm("Are you sure you would like to restart the game from the beginning?\nThis will reset all of your progress.")) {
		const startingDataResponse = await fetch('./starting-game-data.json');
		const gameDataText = await startingDataResponse.text();
		localStorage.setItem('gameData', gameDataText);
		window.location.reload();
	}
}

async function getGameData() {
	var gameDataText = localStorage.getItem('gameData');
	if (!gameDataText) {
		const startingDataResponse = await fetch('./starting-game-data.json');
		gameDataText = await startingDataResponse.text();
		localStorage.setItem('gameData', gameDataText);
	}
	
	const gameData = JSON.parse(gameDataText);
	return gameData;
}

async function getStaticData() {
	if (!this.staticData) {
		const startingDataResponse = await fetch('./static-data.json');
		staticDataObject = await startingDataResponse.json();
		this.staticData = staticDataObject;
	}
	
	return this.staticData;
}

async function parseTextAndInsertDataValues(text) {
	const regex = /%[A-Za-z0-9_().-]+%/g;
	const matches = text.match(regex);
	
	if (matches) {
		const gameData = await this.getGameData();
		const staticData = await this.getStaticData();
		
		const repeats = {};
	
		for (let i = 0; i < matches.length; i++) {
			const match = matches[i];
			if (!repeats[match]) {
				const withoutPercent = match.substring(1, match.length - 1);
				repeats[match] = eval(withoutPercent);
			}
			
			text = text.replace(match, repeats[match]);
		}
	}
	
	return text
}

function clearChoiceButtons() {
	document.getElementById('buttonsDiv').innerHTML = "";
}

async function createChoiceButtons(gameData, choices) {
	const self = this;
	const staticData = await this.getStaticData();
    for (let j = 0; j < choices.length; j++) {
		const singleChoice = choices[j];
		// Only continue if the condition evaluates to true.
		if (eval(singleChoice.condition)) {
			let button = document.createElement('button');
			button.innerText = await this.parseTextAndInsertDataValues(singleChoice.choiceString);
			button.onclick = async function() {
				if (singleChoice.additionalChoices) {
					const nestedChoices = singleChoice.additionalChoices;
					if (!singleChoice.backButton && !nestedChoices[nestedChoices.length - 1].backButton) {
						nestedChoices.push(
							{
								condition: 'true',
								choiceString: 'Back',
								backButton: true,
								additionalChoices: choices
							}
						);
					}
					self.clearChoiceButtons();
					await self.createChoiceButtons(gameData, nestedChoices);
				} else {
					for (let k = 0; k < singleChoice.gameDataModifications.length; k++) {
						const gameModification = singleChoice.gameDataModifications[k];
						const pathToValue = gameModification.name.split('.');
						
						var structure = gameData;
						for (let l = 0; l < pathToValue.length - 1; l++) {
							structure = structure[pathToValue[l]];
						}
						
						if (gameModification.staticValue) {
							structure[pathToValue[pathToValue.length - 1]] = gameModification.staticValue;
						} else {
							// Evaluate the dynamic value then set it.
							const calculatedValue = eval(gameModification.dynamicValue);
							structure[pathToValue[pathToValue.length - 1]] = calculatedValue;
						}
					}
					
					localStorage.setItem('gameData', JSON.stringify(gameData));
					self.loadCurrentScene();
				}
			}
			
			document.getElementById('buttonsDiv').appendChild(button);
		}
	}
}

async function loadCurrentScene() {
	this.clearChoiceButtons();
	
	document.getElementById('textParagraph').innerHTML = '';

	// Get Current Game Data.
    const gameData = await this.getGameData();
    const staticData = await this.getStaticData();

	const sceneResponse = await fetch(gameData.currentScene);
	const sceneResult = await sceneResponse.text();
	
	const sceneData = JSON.parse(sceneResult);
	
	// Create Scene Text.
	let sceneText = '';
	let firstTextAdded = true;
	for (let i = 0; i < sceneData.displayText.length; i++) {
		const singleDisplayText = sceneData.displayText[i];
		// Only continue if the condition evaluates to true.
		if (eval(singleDisplayText.condition)) {
			if (!firstTextAdded) {
				// Two line breaks between each display text.
				sceneText += '\r\n\r\n';
			}
			firstTextAdded = false;
			
			const textResponse = await fetch(singleDisplayText.textLocation);
			const textResult = await textResponse.text();
		
			const parsedTextResult = await this.parseTextAndInsertDataValues(textResult);
			sceneText += parsedTextResult;
		}
	}
	
	// Create Scene Choices
	await this.createChoiceButtons(gameData, sceneData.choices);
	
	document.getElementById('textParagraph').innerHTML = sceneText;
}

document.addEventListener('DOMContentLoaded', async (event) => {
	await this.loadCurrentScene();
});










































































