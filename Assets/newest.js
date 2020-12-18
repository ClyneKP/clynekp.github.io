pause = true;
var mergedData = new Array();
var mergedData2 = new Array();
var allResults = 0
var totalResults = 0

function clearArray(array) {
  while (array.length) {
    array.pop();
  }
}

$(function() {

	/*$("html").append('<div class="kf-timeline"><div class="settings"><span class="pause glyphicon glyphicon-record" title="Record" data-title="Pause" ></span><span class="download glyphicon glyphicon-download" title="Download"></span><span class="clear glyphicon glyphicon-trash" title="Clear"></span></div><div id="container" style="display:inline-flex;margin-top:40px;margin-left: auto;margin-right: auto;margin-bottom: auto;"><div id="loader" style="width: 100%; margin: 0 auto; display:none; border: 10px solid #f3f3f3;border-radius: 50%;border-top: 10px solid #3498db;width: 10px;height: 10px;-webkit-animation: spin 2s linear infinite; animation: spin 2s linear infinite;"></div><div style="display:block; font-size: 60%; height:40%; white-space: pre"><span id="captured">  Results:0</span><span id="results">/0</span></div></div></div><body style="height:100%; margin:0"><iframe src="https://www.zillow.com/homes" width=100% height="100%" style="margin:0; border:0"></iframe></body>');*/

	$('.settings .link').bind('click', function() {

		var setting = $(this).parent(),
			bottom = 0;

		if (parseInt(setting.css('bottom')) == 0) {
			bottom = -setting.height();
		}

		setting.animate({bottom: bottom});

	}).trigger('click');

	$('.settings .pause').bind('click', function() {

		    var title = $(this).attr('title'),
	            data = $(this).data('title');

	        $(this).attr('title', data);
	        $(this).data('title', title);

	        pause = !pause;
		    $(this).toggleClass('glyphicon-record glyphicon-pause');
		});
$('.settings .clear').bind('click', function() {

	  	clearArray(mergedData)

		document.getElementById("captured").innerHTML = '  Results:0'
		document.getElementById("results").innerHTML = '/0'

	});

	$('.settings .download').bind('click', function() {

		if (mergedData.length == 0){
			alert("No data captured");
		}

		var flattened = new Array()

		for (i=0; i < mergedData.length; i++) {flattened.push(JSON.flatten(mergedData[i]))}

		var fields = Object.keys(flattened[0])
		var replacer = function(key, value) { return value === null ? '' : value } 
		var csv = flattened.map(function(row){
		  return fields.map(function(fieldName){
		    return JSON.stringify(row[fieldName], replacer)
		  }).join(',')
		})
		csv.unshift(fields.join(',')) // add header column
		csv = csv.join('\r\n');

		console.save(csv, place + '.csv')

	});


	(function(console){

	    console.save = function(data, filename){

	        if(!data) {
	            console.error('Console.save: No data')
	            return;
	        }

	        if(!filename) filename = 'console.json'

	        if(typeof data === "object"){
	            data = JSON.stringify(data, undefined, 4)
	        }

	        var blob = new Blob([data], {type: 'text/json'}),
	            e    = document.createEvent('MouseEvents'),
	            a    = document.createElement('a')

	        a.download = filename
	        a.href = window.URL.createObjectURL(blob)
	        a.dataset.downloadurl =  ['text/json', a.download, a.href].join(':')
	        e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
	        a.dispatchEvent(e)
	    }
	})(console)


	/*console.save(mergedData, place + '.json')*/

	JSON.flatten = function (data) {
	    var result = {};

	    function recurse(cur, prop) {
	        if (Object(cur) !== cur) {
	            result[prop] = cur;
	        } else if (Array.isArray(cur)) {
	            for (var i = 0, l = cur.length; i < l; i++)
	            recurse(cur[i], prop + "[" + i + "]");
	            if (l == 0) result[prop] = [];
	        } else {
	            var isEmpty = true;
	            for (var p in cur) {
	                isEmpty = false;
	                recurse(cur[p], prop ? prop + "." + p : p);
	            }
	            if (isEmpty && prop) result[prop] = {};
	        }
	    }
	    recurse(data, "");
	    return result;
	};

	const reducer = (accumulator, currentValue) => {
	  if(!accumulator.find(obj => obj.zpid === currentValue.zpid)){
	    accumulator.push(currentValue);
	  }
	  return accumulator;
	};



chrome.runtime.onConnect.addListener(async function(port) {

		port.onMessage.addListener(async function(Message) {


			console.log("Downloading")

			if (pause) {
	        return false;
        	}


			try{
			r = Message.Details.url.split("SearchTerm%22%3A%22")[1].split("%22%2C%22mapBounds")[0]
			r = r.replace("%2C","_")
			place = r.replace("%20","")

			console.log("Downloading")

			var pageN = 25

			  async function downloadData(i){
			  url = Message.Details.url;
			pageing = "pagination%22%3A%7B%22currentPage%22%3A" + i + "%7D%2C%22";
			var res = url.replace("pagination%22%3A%7B%7D%2C%22",pageing);
			var res = res.replace("{%22cat1%22:[%22mapResults%22]}","{%22cat1%22:[%22listResults%22,%22mapResults%22]}");
			var res = res + "&emptyParam=70460277";
			  let response = await fetch(res, {
			  "headers": {
			    "accept": "*/*",
			    "accept-language": "en-US,en;q=0.9",
			    "cache-control": "no-cache",
			    "pragma": "no-cache",
			    "sec-fetch-dest": "empty",
			    "sec-fetch-mode": "cors",
			    "sec-fetch-site": "same-origin"
			  },
			  "referrer": res,
			  "referrerPolicy": "unsafe-url",
			  "body": null,
			  "method": "GET",
			  "mode": "cors",
			  "credentials": "include"
			});
			  let data = await response.json()
			  return data;
			} 

			var downloadedData = new Array();
			for (i=1; i < pageN + 1; i++)
			  {
			  	if (i == 1){
			  		await downloadData(i).then(data => {
			  			results = data.cat1.searchResults.listResults
			  			for (t=0; t < results.length; t++)
						  {
						    mergedData.push(results[t])
						  }

						  mergedData = mergedData.reduce(reducer, []);
			  			totalResults = Math.max(totalResults,data.cat1.searchList.totalResultCount)
			  			thisResults = data.cat1.searchList.totalResultCount
			  			document.getElementById("results").innerHTML = "/" + totalResults.toString()
			  			allResults = mergedData.length
			  			document.getElementById("captured").innerHTML = "  Results:" + allResults.toString()
			  		});

			  		document.getElementById("loader").style.display = "block";

			  	} else{
			  		if(i == 25 && Math.ceil(totalResults/40) > 25 && thisResults > 1000){
			  				await downloadData(i).then(data => 
			  			{
			  					results = data.cat1.searchResults.listResults
					  			for (t=0; t < results.length; t++)
								  {
								    mergedData.push(results[t])
								  }

								  mergedData = mergedData.reduce(reducer, []);
			  				})
			  			document.getElementById("loader").style.display = 'none';
			  			allResults = mergedData.length
			  			document.getElementById("captured").innerHTML = "  Results:" + allResults.toString();
			  			alert("There are " + totalResults.toString() + " results; however, the server can only return 1000 at a time.\n \n Try zooming in and panning over your geography until you've captured every result.");

			  			};
			  			if(i == 25){
			  				await downloadData(i).then(data => 
			  			{
			  					results = data.cat1.searchResults.listResults
					  			for (t=0; t < results.length; t++)
								  {
								    mergedData.push(results[t])
								  }

								  mergedData = mergedData.reduce(reducer, []);
			  				})
			  			document.getElementById("loader").style.display = 'none';
			  			allResults = mergedData.length
			  			document.getElementById("captured").innerHTML = "  Results:" + allResults.toString();
			  			

			  			};
			  		if ( i < Math.ceil(totalResults/40)){
			  			await downloadData(i).then(data => 
			  				{
			  					results = data.cat1.searchResults.listResults
					  			for (t=0; t < results.length; t++)
								  {
								    mergedData.push(results[t])
								  }

								  mergedData = mergedData.reduce(reducer, []);
			  				})
			  				allResults = mergedData.length
			  				document.getElementById("captured").innerHTML = "  Results:" + allResults.toString()
			  		}else{if ( i == Math.ceil(totalResults/40)){
			  			await downloadData(i).then(data => 
			  			{
			  					results = data.cat1.searchResults.listResults
					  			for (t=0; t < results.length; t++)
								  {
								    mergedData.push(results[t])
								  }

								  mergedData = mergedData.reduce(reducer, []);
			  				})
			  			document.getElementById("loader").style.display = 'none';
			  			allResults = mergedData.length
			  			document.getElementById("captured").innerHTML = "  Results:" + allResults.toString();
			  			
			  		}
			  	}
			  	}
			  }

			for (i=0; i < downloadedData.length; i++){
			  for (t=0; t < downloadedData[i].length; t++)
			  {
			    mergedData.push(downloadedData[i][t])
			  }
			}

		}catch{

		}



			mergedData = mergedData.reduce(reducer, []);

		});
});

});