function Agent(numMachines) {
	this.numMachines = numMachines;
}

function BetaAgent(numMachines) {
	Agent.call(this,numMachines);

	this.alphas = [];
	this.betas = [];

	for(var i=0; i<numMachines; i++) {
		this.alphas[i] = 0;
		this.betas[i] = 0;
	}

	this.reset();
}

BetaAgent.prototype = Object.create(Agent.prototype);
BetaAgent.prototype.constructor = BetaAgent;

BetaAgent.prototype.resetWith = function(aInterval,bInterval) {
	for (var i=0; i<this.alphas.length; i++) {
		this.alphas[i] = aInterval[0] + (aInterval[1]-aInterval[0])*Math.random();
		this.betas[i] = bInterval[0] + (bInterval[1]-bInterval[0])*Math.random();
	}
};

BetaAgent.prototype.reset = function() {
	this.resetWith([0,4],[0,4]);
};

BetaAgent.prototype.update = function(machineIndex, payout) {
	this.alphas[machineIndex] += payout;
	this.betas[machineIndex] += 1-payout;
};

BetaAgent.prototype.getMachineToPlay = function() {
	return this.getBestMachine();
};

BetaAgent.prototype.getBestMachine = function() {
	var exps = [];

	for(var i=0; i<this.alphas.length; i++) {
		exps[i] = this.alphas[i] / (this.alphas[i]+this.betas[i]);
	}

	return exps.indexOf(Math.max.apply(null,exps));
};

//Set mean=0 and variance=Infinity for an improper prior
function NormalAgentKnownVariance(numMachines, knownVariances) {
	Agent.call(this, numMachines);

	this.knownVariances = knownVariances;

	this.means = [];
	this.variances = [];

	for(var i=0; i<numMachines; i++) {
		this.means[i] = 0;
		this.variances[i] = 0;
	}

	this.reset();
}

NormalAgentKnownVariance.prototype = Object.create(Agent.prototype);
NormalAgentKnownVariance.prototype.constructor = NormalAgentKnownVariance;

NormalAgentKnownVariance.prototype.resetWith = function(meanInterval, varianceInterval) {
	for (var i=0; i<this.means.length; i++) {
		this.means[i] = meanInterval[0] + (meanInterval[1]-meanInterval[0])*Math.random();
		this.variances[i] = varianceInterval[0] + (varianceInterval[1]-varianceInterval[0])*Math.random();
	}
}

NormalAgentKnownVariance.prototype.resetImproper = function() {
	for (var i=0; i<this.means.length; i++) {
		this.means[i] = 0;
		this.variances[i] = Infinity;
	}
}

NormalAgentKnownVariance.prototype.reset = function() {
	// this.resetWith([0,4],[0,4]);
	this.resetImproper();
}

NormalAgentKnownVariance.prototype.update = function(machine, payout) {
	var n = 1;

	if (this.variances[machine] == Infinity) {
		this.means[machine] = (0+payout/this.knownVariances[machine]) / (0 + 1/this.knownVariances[machine]);

		this.variances[machine] = 1/Math.sqrt(1/this.knownVariances[machine]);

		return;
	}

	this.means[machine] = (n*this.variances[machine])/(n*this.variances[machine] + this.knownVariances[machine])*payout + (this.knownVariances[machine])/(n*this.variances[machine]+this.knownVariances[machine])*this.means[machine];

	this.variances[machine] = (this.knownVariances[machine] * this.variances[machine] ) / (n*this.variances[machine] + this.knownVariances[machine]);
}

NormalAgentKnownVariance.prototype.getMachineToPlay = function() {
	return this.getBestMachine();
}

NormalAgentKnownVariance.prototype.getBestMachine = function() {
	var m = Math.max.apply(null,this.means);

	var mList = [];
	for (var i=0; i<this.means.length; i++) {
		if (this.means[i] >= m) {
			mList.push(i);
		}
	}

	return mList[Math.floor(Math.random()*mList.length)];
}

// Using the method from the Clark paper online
function NormalAgentUnknownMeanAndVariance(numMachines) {
	Agent.call(this, numMachines);

	this.alphas = []; // Number of observations
	this.betas = []; // Sum of observations
	this.gammas = []; // Sum of squares of observations

	this.reset();
}

NormalAgentUnknownMeanAndVariance.prototype = Object.create(Agent.prototype);
NormalAgentUnknownMeanAndVariance.prototype.constructor = NormalAgentUnknownMeanAndVariance;

// Resets to an uninformative prior (mu uniform and var proportional to 1/var)
// In terms of the parameters this means that kappa -> 0 and nu -> 0
NormalAgentUnknownMeanAndVariance.prototype.reset = function() {
	this.alphas = [];
	this.betas = [];
	this.gammas = [];

	for (var i=0; i<this.numMachines; i++) {
		this.alphas[i] = 0;
		this.betas[i] = 0;
		this.gammas[i] = 0;
	}
}

NormalAgentUnknownMeanAndVariance.prototype.update = function(machine, payout) {
	this.alphas[machine] += 1;
	this.betas[machine] += payout;
	this.gammas[machine] += payout*payout;
}

NormalAgentUnknownMeanAndVariance.prototype.getMachineToPlay = function() {
	return this.getBestMachine();
}

NormalAgentUnknownMeanAndVariance.prototype.getBestMachine = function() {
	var expMeans = [];

	for (var i=0; i<this.alphas.length; i++) {
		if (this.alphas[i] != 0)
			expMeans[i] = this.betas[i]/this.alphas[i];
		else
			expMeans[i] = 0;
	}

	var m = Math.max.apply(null,expMeans);

	var mList = [];
	for (var i=0; i<expMeans.length; i++) {
		if (expMeans[i] >= m) {
			mList.push(i);
		}
	}

	return mList[Math.floor(Math.random()*mList.length)];
}

NormalAgentUnknownMeanAndVariance.prototype.sampleMeansList = function() {
	var l = [];
	for (var i=0; i<this.alphas.length; i++) {
		if (this.alphas[i]>0)
			l[i] = this.betas[i] / this.alphas[i];
		else
			l[i] = 0;
	}
	return l;
}

NormalAgentUnknownMeanAndVariance.prototype.sSquaredList = function() {
	var l = [];
	for (var i=0; i<this.alphas.length; i++) {
		if (this.alphas[i]>2) 
			l[i] = (this.alphas[i]*this.gammas[i]-this.betas[i]*this.betas[i])/(this.alphas[i]*(this.alphas[i]-1));
		else
			l[i] = 1
	}
	return l;
}

NormalAgentUnknownMeanAndVariance.prototype.varOfMuList = function() {
	var l = this.sSquaredList();
	for (var i=0; i<l.length; i++) {
		l[i] = l[i]/this.alphas[i];
	}
	return l;
}