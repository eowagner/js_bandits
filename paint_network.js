//This function assumes all inputs are in [0,1]
function hslToRgb(h, s, l){
    var r, g, b;

    if(s == 0){
        r = g = b = l; // achromatic
    }else{
        var hue2rgb = function hue2rgb(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function spacedColors(numColors) {
	var list = [];
	// var skip = 2*Math.PI/numColors;
	var skip = 1.0/numColors;
	var currAngle = 0;

	for (var i=0; i<numColors; i++) {
		var rgb = hslToRgb(currAngle,1,.3);
		list[i] = "rgb("+rgb[0]+","+rgb[1]+","+rgb[2]+")";
		currAngle += skip;
	}

	return list;
}

var textColorListOriginal = spacedColors(5);
var textColorList = [];
textColorList[0] = textColorListOriginal[0];
textColorList[1] = textColorListOriginal[3];
textColorList[2] = textColorListOriginal[2];
textColorList[3] = textColorListOriginal[4];
textColorList[4] = textColorListOriginal[1];
textColorList[4] = 'rgb(255,128,0)';

function xyFromAngle(radians,radius) {
	return { x: radius*Math.sin(radians), y: radius*Math.cos(radians) }
}

function drawAgents(ctx,agents,radiusInside,radiusOutside, plotWidth) {
	var angleStep = 2*Math.PI/agents.length;
	var currAngle = 0;

	for(var i=0; i<agents.length; i++) {
		var point = xyFromAngle(currAngle,radiusInside);
		ctx.beginPath();
		ctx.arc(point.x,point.y,25,0,2*Math.PI);

		ctx.fillStyle = textColorList[agents[i].getBestMachine()];
		ctx.fill();

		drawAgentPDFs(ctx, agents[i], currAngle, radiusOutside, plotWidth);

		currAngle += angleStep;
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

				ctx.moveTo(p0.x, p0.y);
				ctx.lineTo(p1.x, p1.y);
			}
		}
	}
	ctx.stroke();
}

function getAgentCenter(index, numAgents,radius) {
	var angleStep = 2*Math.PI/numAgents;
	var agentAngle = index*angleStep;
	return xyFromAngle(agentAngle,radius);
}

function updateDisplay(ctx, network, radiusInside, radiusOutside, plotWidth) {
	ctx.save();
	ctx.setTransform(1,0,0,1,0,0);
	ctx.clearRect(0,0,canvas.width,canvas.height);
	ctx.restore();

	drawGraph(ctx, network.adjacencyMatrix, radiusInside);
	drawAgents(ctx, network.agents, radiusInside,radiusOutside, plotWidth);
}

function drawAgentPDFs(ctx, agent, angle, radiusOutside, plotWidth) {
	var xValues = linSpace(.001,.999,100);
	var yValues = [];
	var yMaxes = [];

	for(var i=0; i<agent.alphas.length; i++) {
		yValues[i] = betaPDF(xValues, agent.alphas[i],agent.betas[i]);
		yMaxes[i] = Math.max.apply(null,yValues[i]);
	}

	var yMax = Math.max.apply(null,yMaxes);
	yMax = Math.ceil(yMax);

	var width = plotWidth;
	var height = plotWidth;

	paintAxesAt(ctx, xyFromAngle(angle,radiusOutside),width,height, [[0,1],[0,yMax]]);	

	for(var i=0; i<agent.alphas.length; i++) {
		paintFunctionAt(xValues,yValues[i],ctx,xyFromAngle(angle,radiusOutside),width,height,[[0,1],[0,yMax]],textColorList[i]);
	}
}


function betaFunctionFactory(alpha, beta) {
	return function(x) {
		return Math.pow(x,alpha-1)*Math.pow(1-x,beta-1);
	}
}

// Hit maximum call stack size with great frequency no matter the error tolerance
// function betaDenominator(alpha,beta) {
// 	var f = betaFunctionFactory(alpha,beta);
// 	return adaptiveIntegrate(f,0,1,.001);
// }

function betaDenominator(alpha, beta) {
	var du = .01;
	var sum = 0;
	var interiorFunction = betaFunctionFactory(alpha,beta);
	for(var u=0; u<1; u+=du) {
		sum += integrateTrapezoidal(interiorFunction,u,u+du);
	}

	return sum;
}

function integrateTrapezoidal(f, a, b) {
	return (b-a)*f((a+b)/2);
}

//For numerical integration using adaptive Simpson's rule
function simpsonsRule(f,a,b) {
	var c = (a+b)/2;
	var h3 = Math.abs(b-a)/6;
	return h3*(f(a) + 4*f(c) + f(b));
}

//For numerical integration using adaptive Simpson's rule (Never did get this to function correctly for beta distributions--too easy to hit maximum call stack size)
function recursiveAdaptiveSimpsonsRule(f,a,b,epsilon,whole) {
	var c = (b-a)/2;
	var left = simpsonsRule(f,a,c);
	var right = simpsonsRule(f,c,b);

	if (Math.abs(left+right-whole) < 15*epsilon) {
		return left+right +(left+right-whole)/15;
	}
		//return left + right + (left + right - whole)/15;
	return recursiveAdaptiveSimpsonsRule(f,a,c,epsilon/2,left) + recursiveAdaptiveSimpsonsRule(f,c,a,epsilon/2,right);
}

//Integrate a function adaptively using Simpson's Rule
function adaptiveIntegrate(f,a,b,epsilon) {
	return recursiveAdaptiveSimpsonsRule(f,a,b,epsilon,simpsonsRule(f,a,b));
}

// Returns a list of y-values
function betaPDF(xValues, alpha, beta) {
	var yValues = [];

	//Cheat so that it doesn't f-up trying to calculate the PDF when the peak is very high and narrow
	if ((alpha+beta)>1000) {
		var alphaP = (alpha/(alpha+beta))*1000;
		var betaP = (beta/(alpha+beta))*1000;
		alpha = alphaP;
		beta = betaP;
	}

	var denominator = betaDenominator(alpha,beta);
	var numerator = betaFunctionFactory(alpha,beta);

	for(var i=0; i<xValues.length; i++) {
		yValues[i] = numerator(xValues[i])/denominator;
	}

	return yValues;
}

