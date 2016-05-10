var colorFamily = [];
colorFamily[0] = "rgb(153,0,0)";
colorFamily[1] = "rgb(0,61,153)";
colorFamily[2] = "rgb(0,153,61)";
colorFamily[3] = "rgb(122,0,153)";
colorFamily[4] = 'rgb(255,128,0)';
colorFamily[5] = 'rgb(51, 204, 255)';
colorFamily[6] = 'rgb(255, 153, 204)';

function transformFactory(centerPoint,dimensions,plotRange) {
	var leftEdge = centerPoint[0] - dimensions[0]/2;
	var bottomEdge = centerPoint[1] + dimensions[1]/2;

	var spanX = (plotRange[0][1]-plotRange[0][0]);
	var spanY = (plotRange[1][1]-plotRange[1][0]);

	//p should be an array [x.y]
	return function(p) {
		var ratioX = (p[0]-plotRange[0][0]) / spanX;
		var ratioY = (p[1]-plotRange[1][0]) / spanY;
		
		q = [];
		q[0] = leftEdge + ratioX*dimensions[0];
		q[1] = bottomEdge - ratioY*dimensions[1];

		return q;
	}
}

function paintFunctionAt(xVals,yVals,ctx,centerPoint,dimensions,plotRange,styleString) {
	var transform = transformFactory(centerPoint,dimensions,plotRange);

	var p = [xVals[0],yVals[0]];
	var pTransformed = transform(p);

	ctx.beginPath();
	ctx.strokeStyle = styleString;
	ctx.lineWidth = 2;

	ctx.moveTo(pTransformed[0],pTransformed[1]);

	for(var i=1; i<xVals.length; i++) {
		p = [xVals[i], yVals[i]];
		pTransformed = transform(p);
		ctx.lineTo(pTransformed[0],pTransformed[1]);
	}

	ctx.stroke();
}

function paintFrameTitle(label,ctx,centerPoint,dimensions,fontString) {
	ctx.fillStyle = "rgb(0,0,0)";
	ctx.textAlign = "center";
	ctx.font = fontString;
	ctx.fillText(label,centerPoint[0],centerPoint[1]-dimensions[1]/2-6);
}

// Currently does not work for yLabel frams
function paintFrameLabels(xLabel,yLabel,ctx,centerPoint,dimensions,fontString) {
	ctx.fillStyle = "rgb(0,0,0)";
	ctx.textAlign = "center";
	ctx.font = fontString;
	ctx.fillText(xLabel,centerPoint[0],centerPoint[1]+dimensions[1]/2+25);
}

//Paint the axes with black lines, no ticks
function paintAxes(ctx,centerPoint,dimensions,plotRange) {
	var f = transformFactory(centerPoint,dimensions,plotRange);

	ctx.beginPath();
	ctx.strokeStyle = 'rgb(0,0,0)';

	//x-axis
	var p = [plotRange[0][0], 0];
	var pT = f(p);
	ctx.moveTo(pT[0],pT[1]);

	p = [plotRange[0][1], 0];
	pT = f(p);
	ctx.lineTo(pT[0],pT[1]);

	//y-axis
	p = [0,plotRange[1][0]];
	pT = f(p);
	ctx.moveTo(pT[0],pT[1]);

	p = [0,plotRange[1][1]];
	pT = f(p);
	ctx.lineTo(pT[0],pT[1]);

	ctx.stroke();
}

// If !wholeFrame then it only paints the obvious 2
function paintFrameLines(ctx,centerPoint,dimensions,plotRange,wholeFrame) {
	var f = transformFactory(centerPoint,dimensions,plotRange);

	ctx.beginPath();
	ctx.strokeStyle = 'rgb(0,0,0)';
	ctx.lineWidth = 1;
 
	var p = f([plotRange[0][0],plotRange[1][0]]);
	ctx.moveTo(p[0],p[1]);

	p = f([plotRange[0][0], plotRange[1][1]]);
	ctx.lineTo(p[0],p[1]);

	p = f([plotRange[0][1], plotRange[1][1]]);
	if (wholeFrame)
		ctx.lineTo(p[0],p[1]);
	else
		ctx.moveTo(p[0],p[1]);

	p = f([plotRange[0][1], plotRange[1][0]]);
	if (wholeFrame)
		ctx.lineTo(p[0],p[1]);
	else
		ctx.moveTo(p[0],p[1]);

	p = f([plotRange[0][0], plotRange[1][0]]);
	ctx.lineTo(p[0],p[1]);

	if (wholeFrame) {
		p = f(plotRange[0][0],plotRange[1][1]);
		ctx.moveTo(p[0],p[1]);

		p = f(plotRange[0][1],plotRange[1][1]);
		ctx.lineTo(p[0],p[1]);

		p = f(plotRange[0][1],plotRange[1][0]);
		ctx.lineTo(p[0],p[1]);
	}

	ctx.stroke();
}

function paintFrameTicks(ctx,centerPoint,dimensions,plotRange, wholeFrame) {
	var f = transformFactory(centerPoint,dimensions,plotRange);

	var pX0 = plotRange[0][0];
	var pX1 = plotRange[0][1];
	var pY0 = plotRange[1][0];
	var pY1 = plotRange[1][1];

	var skipX = (plotRange[0][1]-plotRange[0][0])/4;
	var skipY = (plotRange[1][1]-plotRange[1][0])/4;

	var tickLengthX = (plotRange[1][1]-plotRange[1][0])/33; // Length of tick marks on the x-frame (they are vertical)
	var tickLengthY = (plotRange[0][1]-plotRange[0][0])/33;
	var labelOffset = 14;

	ctx.fillStyle = "rgb(0,0,0)";
	ctx.textAlign = "center";
	ctx.font = "12px Verdana";	

	var p = 0;
	
	// x-Frame labels
	for (var i=0; i<5; i++) {
		
		ctx.beginPath();

		// Draw the tick on the top
		if (wholeFrame) {
			p = f([pX0+skipX*i, pY1]);
			ctx.moveTo(p[0],p[1]);

			p = f([pX0+skipX*i, pY1-tickLengthX]);
			ctx.lineTo(p[0],p[1]);
		}

		// Draw the tick on the bottom
		p = f([pX0+skipX*i, pY0+tickLengthX]);
		ctx.moveTo(p[0],p[1]);

		p = f([pX0+skipX*i, pY0]);
		ctx.lineTo(p[0],p[1]);

		ctx.stroke();

		// Draw the label
		ctx.fillText((pX0+skipX*i).toPrecision(2), p[0], p[1]+labelOffset);
	}
	
	// y-Frame labels
	for (var i=0; i<5; i++) {
		ctx.beginPath();

		//Draw the right hand tick
		if (wholeFrame) {
			p = f([pX1-tickLengthY, pY0+skipY*i]);
			ctx.moveTo(p[0],p[1]);

			p = f([pX1, pY0+skipY*i]);
			ctx.lineTo(p[0],p[1]);
		}

		// Draw the left hand tick
		p = f([pX0+tickLengthY, pY0+skipY*i]);
		ctx.moveTo(p[0],p[1]);

		p = f([pX0, pY0+skipY*i]);
		ctx.lineTo(p[0],p[1]);

		ctx.stroke();

		// Draw the label
		ctx.fillText((pY0+skipY*i).toPrecision(2), p[0]-labelOffset, p[1]+labelOffset/3);
	}
}

function getMinMax(list) {
	var min = Math.min.apply(null,list);
	var max = Math.max.apply(null,list);

	return [min,max];
}

function getYRange(lists) {
	var mins = [];
	var maxs = [];

	for (var i=0; i<lists.length; i++) {
		var t = getMinMax(lists[i]);
		mins[i] = t[0];
		maxs[i] = t[1];
	}

	return [Math.min.apply(null,mins), Math.max.apply(null,maxs) ];
} 

// Plot two standard deviations out from the mean in each direction
function getNormalPlotDomain(mean, variance) {
	if (variance == Infinity) {
		return [-1, 1];
	}

	var stdDev = Math.sqrt(variance);

	return [ mean-2*stdDev, mean+2*stdDev ];
}

function getNormalPlotDomainList(means, variances) {
	var mins = [];
	var maxs = [];

	for (var i=0; i<means.length; i++) {
		var t = getNormalPlotDomain(means[i],variances[i]);
		mins[i] = t[0];
		maxs[i] = t[1];
	}

	return [ Math.min.apply(null,mins), Math.max.apply(null,maxs) ];
}

function getFloorCeil(r) {
	return [ Math.floor(r[0]), Math.ceil(r[1]) ];
}