// const plotWidths = [140,120,90,80,75];
// const insideRadii = [.4,.5,.6,.62,.64];
// const outsideRadii = [.75,.8,.85,.86,.87];

const plotWidths = [140,120,90,78,73];
const insideRadii = [.4,.5,.6,.62,.64];
const outsideRadii = [.75,.8,.83,.84,.85];

// Canvas Setup 
var canvas;
var ctx;

var halfHeight;
var halfWidth;

var radiusInside;
var radiusOutside;
var plotWidth;

// Simulation Setup
var knownVariance = true;

var machineMeans = [0,1,2,3,4];
var machineVariances = [1,2,3,4,5];

var machines = [];
for (var i=0; i<2; i++) {
	machines[i] = new NormalMachine(machineMeans[i],machineVariances[i]);
}

var numAgents = 9;

var agents = [];
for (var i=0; i<numAgents; i++) {
	agents[i] = new NormalAgentUnknownMeanAndVariance(2);
}

var adjMatrix = makeCompleteGraph(numAgents);
var net = new Network(agents,machines,adjMatrix);

//Load and paint
$( document ).ready(function() {    
	canvas = document.getElementById("myCanvas");
	ctx = canvas.getContext("2d");

	halfHeight = canvas.height/2;
	halfWidth = canvas.width/2;

	radiusInside = insideRadii[0]*halfHeight;
	radiusOutside = outsideRadii[0]*halfHeight;
	plotWidth = plotWidths[0];

	ctx.transform(1,0,0,1,halfWidth,halfHeight);

	reset();
	updateDisplay(ctx,net,radiusInside,radiusOutside,[plotWidth,plotWidth]);
});

function paintAgentBeliefsAt(agent,ctx,centerPoint,dimensions) {
	if (knownVariance)
		paintAgentBeliefsAt_KnownVar(agent,ctx,centerPoint,dimensions);
	else
		paintAgentBeliefsAt_UnknownVar(agent,ctx,centerPoint,dimensions);
}

function paintAgentBeliefsAt_KnownVar(agent,ctx,centerPoint,dimensions) {

	var xRange = getFloorCeil(getNormalPlotDomainList(agent.means, agent.variances));

	var xVals = linSpace(xRange[0],xRange[1],100);
	var yVals = [];

	for (var i=0; i<agent.means.length;i++) {
		var pdf_func = normal_distribution_PDF_factory(agent.means[i],agent.variances[i]);
		yVals[i] = xVals.map(pdf_func);
	}
	
	var yRange = getFloorCeil(getYRange(yVals));
	var pRange = [ xRange, yRange ];

	// paintAxes(ctx,centerPoint,dimensions,pRange);
	paintFrameLines(ctx,centerPoint,dimensions,pRange,true);
	paintFrameTicks(ctx,centerPoint,dimensions,pRange, true);

	for (var i=0; i<yVals.length; i++) {
		paintFunctionAt(xVals,yVals[i],ctx,centerPoint,dimensions,pRange,colorFamily[i]);
	}

	if (numAgents<10)
		paintFrameTitle("Probability Density Function",ctx,centerPoint,dimensions,"12px Verdana");
	else
		paintFrameTitle("PDF",ctx,centerPoint,dimensions,"12px Verdana");

	paintFrameLabels("\u03BC","",ctx,centerPoint,dimensions,"12px Verdana");
}

function paintAgentBeliefsAt_UnknownVar(agent,ctx,centerPoint,dimensions) {

	// var xRange = getFloorCeil(getNormalPlotDomainList(agent.means, agent.variances));
	
	var meansList = agent.sampleMeansList();
	var sSquaredList = agent.sSquaredList();
	var xRange = getFloorCeil(getNormalPlotDomainList(meansList, sSquaredList));

	var xVals = linSpace(xRange[0],xRange[1],100);
	var yVals = [];

	var maxObservations = Math.max.apply(null,agent.alphas);
	var gammaError = true;

	// If there are too many degrees of freedom then the gamma functions yield numbers too large for js to process
	if (maxObservations>250)
		gammaError = false;

	for (var i=0; i<agent.alphas.length;i++) {
		var degreesOfFreedom = agent.alphas[i]-1;

		if (gammaError)
			var pdf_func = t_distribution_PDF_generator(degreesOfFreedom,meansList[i],sSquaredList[i]);
		else {
			var varOfMuList = agent.varOfMuList();
			var pdf_func = normal_distribution_PDF_factory(meansList[i],varOfMuList[i]); // Just approximate by a normal distribution
			// var pdf_func = t_distribution_PDF_generator_unnormalized(degreesOfFreedom,meansList[i],sSquaredList[i]);
		}

		yVals[i] = xVals.map(pdf_func);
	}
	
	var yRange = getFloorCeil(getYRange(yVals));
	var pRange = [ xRange, yRange ];

	// paintAxes(ctx,centerPoint,dimensions,pRange);
	paintFrameLines(ctx,centerPoint,dimensions,pRange,true);
	paintFrameTicks(ctx,centerPoint,dimensions,pRange, true);

	for (var i=0; i<yVals.length; i++) {
		paintFunctionAt(xVals,yVals[i],ctx,centerPoint,dimensions,pRange,colorFamily[i]);
	}

	// Gelman example page 30 "Unnormalized posterior density for bineomial parameter theta"
	// Pg 60 "marginal posterior distribution of mu"
	// if (gammaError)
		// paintFrameTitle("Marginal PDF of \u03BC",ctx,centerPoint,dimensions,"12px Verdana");
	// else 
		// paintFrameTitle("Unnormalized marginal PDF of \u03BC",ctx,centerPoint,dimensions,"12px Verdana");

	paintFrameTitle("Marginal PDF of \u03BC",ctx,centerPoint,dimensions,"12px Verdana");
	paintFrameLabels("\u03BC","",ctx,centerPoint,dimensions,"12px Verdana");
}

function xyFromAngle(radians,radius) {
	return [ radius*Math.sin(radians), radius*Math.cos(radians) ];
}

function getAgentCenter(index, numAgents,radius) {
	var angleStep = 2*Math.PI/numAgents;
	var agentAngle = index*angleStep;
	return xyFromAngle(agentAngle,radius);
}

function paintAgents(ctx,agents,radiusInside,radiusOutside, plotDim) {
	var angleStep = 2*Math.PI/agents.length;
	var currAngle = 0;

	for (var i=0; i<agents.length; i++) {
		var cPoint = getAgentCenter(i,agents.length,radiusInside);

		ctx.beginPath();
		ctx.arc(cPoint[0],cPoint[1],25,0,2*Math.PI);
		ctx.fillStyle = colorFamily[agents[i].getBestMachine()];
		ctx.fill();

		cPoint = xyFromAngle(angleStep*i,radiusOutside);

		paintAgentBeliefsAt(agents[i],ctx,cPoint,plotDim);
	}
}

function drawGraph(ctx, adjMatrix, radius) {
	var numAgents = adjMatrix.length;

	ctx.beginPath();
	ctx.strokeStyle = 'rgb(0,0,0)';
	ctx.lineWidth = 2;

	for(var i=0; i<numAgents; i++) {
		var p0 = getAgentCenter(i,numAgents,radius);

		for(var j=0; j<numAgents; j++) {
			if( i != j && adjMatrix[i][j]==1 ) {
				var p1 = getAgentCenter(j,numAgents,radius);

				ctx.moveTo(p0[0], p0[1]);
				ctx.lineTo(p1[0], p1[1]);
			}
		}
	}
	ctx.stroke();
}

function updateDisplay(ctx, network, radiusInside, radiusOutside, plotDim) {
	ctx.save();
	ctx.setTransform(1,0,0,1,0,0);
	ctx.clearRect(0,0,canvas.width,canvas.height);
	ctx.restore();

	drawGraph(ctx, network.adjacencyMatrix, radiusInside);
	paintAgents(ctx, network.agents, radiusInside,radiusOutside, plotDim);
}

function reset() {
	//Type of simulation
	var setup_radio = document.getElementsByName('setup_radio');
	if (setup_radio[0].checked)
		knownVariance = true;
	else
		knownVariance = false;

	//Arm data
	numArms = document.getElementById('num_arms_input').value;
	armMeanElements = document.getElementsByName('arm_mean');
	armVarElements = document.getElementsByName('arm_var');
	machines = [];
	machineVariances = [];
	for (var i=0; i<numArms; i++) {
		machines[i] = new NormalMachine(parseFloat(armMeanElements[i].value),parseFloat(armVarElements[i].value));
		machineVariances[i] = parseFloat(armVarElements[i].value);
	}

	//Agents
	numAgents = document.getElementById('num_agents_input').value;
	agents = [];
	for (var i=0; i<numAgents; i++) {
		if (knownVariance)
			agents[i] = new NormalAgentKnownVariance(machines.length,machineVariances);
		else
			agents[i] = new NormalAgentUnknownMeanAndVariance(machines.length);
	}

	//Network
	var net_radio = document.getElementsByName('net_radio');
	var adjMatrix = [];
	if (net_radio[0].checked)
		adjMatrix = makeCompleteGraph(numAgents);
	else if (net_radio[1].checked)
		adjMatrix = makeCycleGraph(numAgents);
	else if (net_radio[2].checked)
		adjMatrix = makeWheelGraph(numAgents);
	else if (net_radio[3].checked)
		adjMatrix = makeLineGraph(numAgents);
	else if (net_radio[4].checked)
		adjMatrix = makeStarGraph(numAgents);
	else
		adjMatrix = makeTwoCliquesGraph(numAgents);

	net = new Network(agents,machines,adjMatrix);

	//Massage display parameters
	index = 0;
	if (numAgents>9 && numAgents<=11)
		index = 1;
	else if (numAgents>11 && numAgents<=14) 
		index = 2;
	else if (numAgents>14 && numAgents<=16)
		index = 3;
	else if (numAgents>16)
		index = 4;

	plotWidth = plotWidths[index];
	radiusInside = insideRadii[index]*halfHeight;
	radiusOutside = outsideRadii[index]*halfHeight;

	updateDisplay(ctx,net,radiusInside, radiusOutside, [plotWidth,plotWidth]);
}

function armSlide(v) {
	document.getElementById('num_arms_span').innerHTML = v;

	armMeanElements = document.getElementsByName('arm_mean');
	armVarElements = document.getElementsByName('arm_var');

	for(var i=0; i<armMeanElements.length; i++) {
		if(i<v) {
			armMeanElements[i].removeAttribute("disabled");
			armVarElements[i].removeAttribute("disabled");
		}
		else {
			armMeanElements[i].setAttribute("disabled","true");
			armVarElements[i].setAttribute("disabled","true");
		}
	}

	reset();
}

function agentsSlide(v) {
	document.getElementById('num_agents_span').innerHTML = v;

	reset();
}

function stepForward() {
	net.step();
	
	updateDisplay(ctx,net,radiusInside,radiusOutside,[plotWidth,plotWidth]);
}
