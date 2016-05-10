function Network(agents, machines, adjacencyMatrix) {
	this.agents = agents;
	this.machines = machines;
	this.adjacencyMatrix = adjacencyMatrix;

	this.getActs = function() {
		var acts = [];
		for (var i=0; i<this.agents.length; i++) {
			acts[i] = this.agents[i].getMachineToPlay();
		}
		return acts;
	}

	this.getPayouts = function(acts) {
		var payouts = [];
		for (var i=0; i<acts.length; i++) {
			payouts[i] = machines[acts[i]].pull();
		}
		return payouts;
	}

	this.step = function() {
		var acts = this.getActs();
		var payouts = this.getPayouts(acts);

		for (var i=0; i<this.adjacencyMatrix.length; i++) {
			for (var j=0; j<this.adjacencyMatrix.length; j++) {
				if (this.adjacencyMatrix[i][j] == 1)
					this.agents[i].update(acts[j],payouts[j]);
			}
		}
	}
}


//In all of these graphs the everyone sees the hub agent and the hub agent also pulls levers
function makeTwoCliquesGraph(numAgents) {
	var m = [];

	for(var i=0; i<numAgents; i++) {
		m[i] = [];
		for(var j=0; j<numAgents; j++) {
			if( (i<numAgents/2 && j<numAgents/2) || (i>=numAgents/2 && j>=numAgents/2) )
				m[i][j] = 1;
			else
				m[i][j] = 0;
		}
	}

	m[0][numAgents-1] = 1;
	m[numAgents-1][0] = 1;

	return m;
}

function makeStarGraph(numAgents) {
	var m = [];
	for (var i=0; i<numAgents; i++) {
		m[i] = [];
		for (var j=0; j<numAgents; j++) {
			if (i==0 || j==0 || i==j)
				m[i][j] = 1;
			else
				m[i][j] = 0;
		}
	}
	return m;
}

function makeCompleteGraph(numAgents) {
	var m = [];
	for (var i=0; i<numAgents; i++) {
		m[i] = [];
		for (var j=0; j<numAgents; j++) {
			m[i][j] = 1;
		}
	}
	return m;
}

function makeWheelGraph(numAgents) {
	var m = [];
	for (var i=0; i<numAgents; i++) {
		m[i] = [];
		for(var j=0; j<numAgents; j++) {
			if (i==0 || j==0 || i==j)
				m[i][j] = 1;
			else if (j==(i+1)%numAgents || j==(i-1)%numAgents)
				m[i][j] = 1;
			else
				m[i][j] = 0;
		}
	}
	return m;
}

function makeCycleGraph(numAgents) {
	var m = [];
	for (var i=0; i<numAgents; i++) {
		m[i] = [];
		for(var j=0; j<numAgents; j++) {
			if (i==j)
				m[i][j] = 1;
			else if (j==(i+1)%numAgents || j==(i-1)%numAgents)
				m[i][j] = 1;
			else
				m[i][j] = 0;
		}
	}
	return m;
}

function makeLineGraph(numAgents) {
	var m = [];
	for (var i=0; i<numAgents; i++) {
		m[i] = [];
		for(var j=0; j<numAgents; j++) {
			if (i==j)
				m[i][j] = 1;
			else if (j==(i+1) || j==(i-1))
				m[i][j] = 1;
			else
				m[i][j] = 0;
		}
	}
	return m;
}