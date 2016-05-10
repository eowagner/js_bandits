function betaFunctionFactory(alpha, beta) {
	return function(x) {
		return Math.pow(x,alpha-1)*Math.pow(1-x,beta-1);
	}
}

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

function linSpace(start, end, numPoints) {
	var list = [start];
	var step = (end-start)/(numPoints-1);
	for (var i=1; i<numPoints; i++) {
		list[i] = list[i-1] + step;
	}
	return list;
}

function normal_distribution_PDF_factory(mu,variance) {
	if (variance==Infinity) {
		return function(x) {
			return .1;
		}
	}
	
	return function(x) {
		return 1.0/Math.sqrt(variance*2*Math.PI) * Math.exp(-1.0*(x-mu)*(x-mu)/(2*variance));
	}
}

function t_distribution_PDF_generator(degreesOfFreedom,sampleMean,sampleSSquared) {
	// Improper prior -- uniform distribution over means
	if (degreesOfFreedom==-1) {
		return function(mean) {
			return .1;
		}
	}

	var scale = t_distribution_PDF_scaling(degreesOfFreedom,sampleMean,sampleSSquared);
	var func = t_distribution_PDF_generator_unnormalized(degreesOfFreedom,sampleMean,sampleSSquared);

	// One observation, cannot scale because Gamma(0) is undefined
	if (degreesOfFreedom==0) {
		return function(mean) {
			return func(mean);
		}
	}

	//Otherwise, scale the PDF
	return function(mean) {
		return scale*func(mean);
	}
}

function t_distribution_PDF_generator_unnormalized(degreesOfFreedom, sampleMean, sampleSSquared) {
	// Improper prior -- uniform distribution over means
	if (degreesOfFreedom==-1) {
		return function(mean) {
			return .1;
		}
	}

	// One observation, values in the denominator 0 times infinity.  I am assuming there is a convention that this yields 1.  
	if (degreesOfFreedom==0) {
		return function(mean) {
			return Math.pow(1+(degreesOfFreedom+1)*(mean-sampleMean)*(mean-sampleMean),-1*(degreesOfFreedom+1)/2);
		}
	}

	//So return the unnormalized version
	return function(mean) {
		return Math.pow(1+((degreesOfFreedom+1)*(mean-sampleMean)*(mean-sampleMean))/(degreesOfFreedom*sampleSSquared),-1*(degreesOfFreedom+1)/2);
	}
}

// Lanczos method for calculating gamma function
var g = 7;
var C = [0.99999999999980993, 676.5203681218851, -1259.1392167224028,771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
function gamma(z) {

    if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
    else {
        z -= 1;

        var x = C[0];
        for (var i = 1; i < g + 2; i++)
        x += C[i] / (z + i);

        var t = z + g + 0.5;
        return Math.sqrt(2 * Math.PI) * Math.pow(t, (z + 0.5)) * Math.exp(-t) * x;
    }
}

// t-distribution PDF is proportional to the other function, the real pdf if scaled by multiplying it by this
function t_distribution_PDF_scaling(degreesOfFreedom,sampleMean,sampleSSquared) {
	var sigma = Math.sqrt(sampleSSquared/(degreesOfFreedom+1));
	var g1 = gamma((degreesOfFreedom+1)/2);
	var g2 = gamma(degreesOfFreedom/2);
	var otherJunk = Math.sqrt(Math.PI*degreesOfFreedom)*sigma;

	return g1/(g2*otherJunk);
}