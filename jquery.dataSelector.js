/*
Copyright (c) <year>, Pim Jager
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
* Redistributions of source code must retain the above copyright
notice, this list of conditions and the following disclaimer.
* Redistributions in binary form must reproduce the above copyright
notice, this list of conditions and the following disclaimer in the
documentation and/or other materials provided with the distribution.
* The name Pim Jager may not be used to endorse or promote products
derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY Pim Jager ''AS IS'' AND ANY
EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL Pim Jager BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
(function($){
	//We use a small helper function that will return true when 'a' is undefined (so we can do if(checkUndefined(data)) return false;
	//If we would continue with undefined data we would piss javascript off as we would be getting properties of an
	//non-exsitent object (ie typeof data === 'undefined'; data.fooBar; //throws error
	var checkUndefined = function(a) {
		return typeof a === 'undefined';
	}
	$.expr[':'].data = function(elem, counter, params){
		if(checkUndefined(elem) || checkUndefined(params)) return false;
		//:data(__) accepts 'dataKey', 'dataKey=Value', 'dataKey.InnerdataKey', 'dataKey.InnerdataKey=Value'
		//Also instead of = we accept: != (does not equal Value), ^= (starts with Value), 
		//		$= (ends with Value), *=Value (contains Value);
		//$(elem).data(dataKey) or $(elem).data(dataKey)[innerDataKey] (optional more innerDataKeys)
		//When no value is speciefied we return all elements that have the dataKey specified, similar to [attribute]
		var query = params[3]; //The part in the parenthesis, thus: selector:data( query )
		if(!query) return false; //query can not be anything that evaluates to false, it has to be string
		var querySplitted = query.split('='); //for dataKey=Value/dataKey.innerDataKey=Value
		//We check if the condition was an =, an !=, an $= or an *=
		var selectType = querySplitted[0].charAt( querySplitted[0].length-1 );
		if(selectType == '^' || selectType == '$' || selectType == '!' || selectType == '*'){
			querySplitted[0] = querySplitted[0].substring(0, querySplitted[0].length-1);
			//the ^=, *= and $= are only available when the $.stringQuery plugin is loaded, if it is not and any of these are used we return false
			if(!$.stringQuery && selectType != '!'){
				return false;
			}
		}
		else selectType = '=';
		var dataName = querySplitted[0]; //dataKey or dataKey.innerDataKey
		//Now we go check if we need dataKey or dataKey.innerDataKey
		var dataNameSplitted = dataName.split('.');
		var data = $(elem).data(dataNameSplitted[0]);
		if(checkUndefined(data)) return false;
		if(dataNameSplitted[1]){//We have innerDataKeys
			for(i=1, x=dataNameSplitted.length; i<x; i++){ //we start counting at 1 since we ignore the first value because that is the dataKey
				data = data[dataNameSplitted[i]];
				if(checkUndefined(data)) return false;
			}
		}
		if(querySplitted[1]){ //should the data be of a specified value?
			var checkAgainst = (data+'');
				//We cast to string as the query will always be a string, otherwise boolean comparison may fail
				//beacuse in javaScript true!='true' but (true+'')=='true'
			//We use this switch to check if we chould check for =, $=, ^=, !=, *=
			switch(selectType){
				case '=': //equals
					return checkAgainst == querySplitted[1]; 
				break;
				case '!': //does not equeal
					return checkAgainst != querySplitted[1];
				break;
				case '^': //starts with
					return $.stringQuery.startsWith(checkAgainst, querySplitted[1]);
				break;
				case '$': //ends with
					return $.stringQuery.endsWith(checkAgainst, querySplitted[1]);
				break;
				case '*': //contains
					return $.stringQuery.contains(checkAgainst, querySplitted[1]);
				break;
				default: //default should never happen
					return false;
				break;
			}			
		}
		else{ //the data does not have to be a speciefied value
				//, just return true (we are here so the data is specified, otherwise false would have been returned by now)
			return true;
		}
	}
})(jQuery);