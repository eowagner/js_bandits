function NormalMachine(mean, variance) {
	this.mean = mean;
	this.variance = variance;
}

// Polynomial approximation for the erf function
NormalMachine.prototype.erf = function(x) {
	var a = [ 0.278393, 0.230389, 0.000972, 0.078108 ];

	var temp = 1 + a[0]*x + a[1]*x*x + a[2]*x*x*x + a[3]*x*x*x*x;

	return 1 - 1 / Math.pow(temp,4);
}

NormalMachine.prototype.erfInverse = function(x) {
	var a = .140012;

	var t1 = 2/(Math.PI*a) + Math.log(1-x*x)/2;
	var t2 = Math.log(1-x*x)/a;

	return Math.sign(x) * Math.sqrt( Math.sqrt(t1*t1 - t2) - t1 );
}

// Used for inverse transformation sampling
NormalMachine.prototype.quantileFunction = function(p) {
	return this.mean + Math.sqrt(this.variance *2) * this.erfInverse(2*p-1);
}

NormalMachine.prototype.pull = function() {
	var r = Math.random();

	return this.quantileFunction(r);
}


function BernoulliMachine(p) {
	this.p = p;

	this.pull = function() {
		var r = Math.random();
		if (r < p) 
			return 1;
		return 0;
	};
}


