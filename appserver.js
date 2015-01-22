#!/usr/bin/env node

var express = require('express'),
    cellunits = require('./cellunits');

var app = express();


//test api
app.get('/api', function (req, res) {
    res.send('API is running');
});
//to get all modules
app.get('/api/module/', function(req,res){

    cellunits.getallModules(req,res);
});
//get each modules cell data
app.get('/api/snapshot/:modulename/', function(req,res){
    cellunits.getModuleByName(req,res);
});
//get overall data of modules
app.get('/api/stackshot/:modulename/', function(req,res){
    cellunits.getSums(req,res);
});
//set cell parameters in stack table
app.get('/api/units/:cellparameter/:cellvalue/', function(req,res){
        cellunits.setUnitData(req,res);
});
//get cell parameters from db
app.get('/api/unitreturn/', function(req,res){
        cellunits.getUnitData(req,res);
});
//get cell names
app.get('/api/getcellnames/', function(req,res){
    var resObj=[];
    var i;
    for(i=1;i<13;i++){
        var rowValue= {name:'Cell '+i}
        resObj.push(rowValue)
    }
    res.send(resObj)
});

app.get('/api/getcellstatus/:modulename',function(req,res){
    cellunits.getstatus(req,res);
})

app.listen(8080);

