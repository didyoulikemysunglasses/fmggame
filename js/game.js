async function restartGame() {
	const startingDataResponse = await fetch('./starting-game-data.json');
	const gameDataText = await startingDataResponse.text();
	localStorage.setItem('gameData', gameDataText);
	window.location.reload();
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

async function parseTextAndInsertDataValues(text) {
	const regex = /%[A-Za-z0-9_.-]+%/g;
	const matches = text.match(regex);
	
	if (matches) {
		const gameData = await this.getGameData();
		const repeats = {};
	
		for (let i = 0; i < matches.length; i++) {
			const match = matches[i];
			if (!repeats[match]) {
				const withoutPercent = match.substring(1, match.length - 1);
				const pathToValue = withoutPercent.split('.');
				
				var value = gameData;
				for (let j = 0; j < pathToValue.length; j++) {
					const name = pathToValue[j];
					value = value[name];
				}
				
				repeats[match] = value;
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
    for (let j = 0; j < choices.length; j++) {
		const singleChoice = choices[j];
		
		let button = document.createElement('button');
		button.innerText = await this.parseTextAndInsertDataValues(singleChoice.choiceString);
		button.onclick = async function() {
			if (singleChoice.additionalChoices) {
				const nestedChoices = singleChoice.additionalChoices;
				if (!singleChoice.backButton && !nestedChoices[nestedChoices.length - 1].backButton) {
					nestedChoices.push(
						{
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
					
					structure[pathToValue[pathToValue.length - 1]] = gameModification.value;
				}
				
				localStorage.setItem('gameData', JSON.stringify(gameData));
				self.loadCurrentScene();
			}
		}
		
		document.getElementById('buttonsDiv').appendChild(button);
	}
}

async function loadCurrentScene() {
	this.clearChoiceButtons();

	// Get Current Game Data.
	const gameData = await this.getGameData();

	const sceneResponse = await fetch(gameData.currentScene);
	const sceneResult = await sceneResponse.text();
	
	const sceneData = JSON.parse(sceneResult);
	
	// Create Scene Text.
	let sceneText = '';
	let firstTextAdded = true;
	for (let i = 0; i < sceneData.displayText.length; i++) {
		const singleDisplayText = sceneData.displayText[i];
	
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
	
	// Create Scene Choices
	await this.createChoiceButtons(gameData, sceneData.choices);
	
	document.getElementById('textParagraph').innerHTML = sceneText;
}

document.addEventListener('DOMContentLoaded', async (event) => {
	await this.loadCurrentScene();
});










































































