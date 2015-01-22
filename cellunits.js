//var dbpath= '/home/batBal/db/';
var dbpath= '';
var sqlite3= require('sqlite3').verbose(),
    path= require('fs');



    Array.prototype.transpose || (Array.prototype.transpose = function() {
        if (!this.length) {
            return [];

        }

        if (this[0] instanceof Array) {
            var tlen = this.length,
                dlen = this[0].length,
                newA = new Array(dlen);
        } else {
            throw new Error("Log error");
        }

        for (var i = tlen; i--;) {
            if (this[i].length !== dlen) throw new Error("Index Error!");
        }

        for (var i = 0; i < dlen; ++i) {
            newA[i] = [];
            for (var j = 0, l = tlen; j < l; j++) {
                newA[i][j] = this[j][i];
            }
        }

        return newA;
    });

    function listToMatrix(list, elementsPerSubArray) {
        var matrix = [], i, k;

        for (i = 0, k = -1; i < list.length; i++) {
            if (i % elementsPerSubArray === 0) {
                k++;
                matrix[k] = [];
            }

            matrix[k].push(list[i]);
        }

        return matrix;
    }

function getOneShot(name,req,res){

    var obj=[];
    var statobj=[]
    var parity=0;
    var moduledb = new sqlite3.Database(dbpath+name);
    moduledb.serialize(function() {

//              moduledb.each("select * from oneshot where Parameter='Voltage Adc' OR Parameter='Current Bal' OR Parameter='IC Temperature' OR Parameter='R DCR' OR Parameter='R W'", function(err, row) {
                moduledb.each("select Parameter,Cell1,Cell2,Cell3,Cell4,Cell5,Cell6,Cell7,Cell8,Cell9,Cell10,Cell11,Cell12 from oneshot union select Meastime,Cell1,Cell2,Cell3,Cell4,Cell5,Cell6,Cell7,Cell8,Cell9,Cell10,Cell11,Cell12  from 'Cell Balancer Status'", function(err, row) {
                      parity=row.Parameter;
                      obj.push(row.Parameter, row.Cell1, row.Cell2, row.Cell3, row.Cell4, row.Cell5, row.Cell6, row.Cell7, row.Cell8, row.Cell9, row.Cell10, row.Cell11, row.Cell12)

        }, function() {
//                  statobj=obj;
//                  console.log(statobj+'lol')
//                  moduledb.each("select * from 'Cell Balancer Status'", function(err, row) {
//                      statobj.push('cellvalue', row.Cell1, row.Cell2, row.Cell3, row.Cell4, row.Cell5, row.Cell6, row.Cell7, row.Cell8, row.Cell9, row.Cell10, row.Cell11, row.Cell12)
//
//                  },function(){
//                        console.log(statobj)
//                  })
            var matrix = listToMatrix(obj,13).transpose();
            var i;
            var resonseObj=[];
                if(parity==0){

                        resonseObj.push({});
                }
                else {
                    for (i = 1; i < 13; i++) {
                        var rowValue = {name: 'Cell ' + i, VoltageAdc: matrix[i][5], CurrentBal: matrix[i][1], ICTemperature: matrix[i][2], RDCR: matrix[i][3], RW: matrix[i][4], CellStatus:'legend'+matrix[i][0]}
                        resonseObj.push(rowValue);
                    }
                }


  //          res.send(obj)
            res.send(resonseObj)
            obj.length=0;
            resonseObj.length=0;
            obj=null;
            resonseObj=null;
            moduledb.close();


        })
});
};


exports.getSums = function(req,res){
    var db= new sqlite3.Database('MASTER.db');
    var name=''
    db.serialize(function(){

        db.each("select * from Module where NAME='"+[req.params.modulename]+"'",function(err,row){
            name= row['FILE NAME'];
        },function(){
            if(path.existsSync(dbpath+name)) {
                var moduledb=new sqlite3.Database(dbpath+name);
                var obj=[];
                var parity=0;
                moduledb.serialize(function(){
                    moduledb.each("select * from oneshot where Parameter='Voltage Adc' OR Parameter='Current Bal' OR Parameter='IC Temperature' OR Parameter='R DCR' OR Parameter='R W'", function(err, row) {
                        parity= row.Parameter;
                        obj.push({parameter:row.Parameter, value:(row.Cell1+row.Cell2+row.Cell3+row.Cell4+row.Cell5+row.Cell6+row.Cell7+row.Cell8+row.Cell9+row.Cell10+row.Cell11+row.Cell12).toFixed(2)})

                    },function(){

                        moduledb.close();
                        if(parity==0){

                            res.send({});
                        }
                        else {


                            res.send(obj);
                            obj.length=0;
                            obj=null;
                        }
                    })
                })

            }
            else{
                res.send({})
            }

        });
    });

}


exports.setUnitData= function(req,res){
    var dbconn= new sqlite3.Database('MASTER.db');
    var newDate = new Date().getUTCDate();
    var property=req.params.cellparameter;
    //var property=req.query.cellproperty;
    var cellValue=req.params.cellvalue;
    //var cellValue=req.query.cellvalue;
    //var stmt ="if (SELECT count(*) from Stack where 'config name'='23')=0 begin select 1 End else begin select 2 End";
    var stmt="SELECT count(*) from Stack where \"config name\"='"+property+"'"
    dbconn.serialize(function(){


        dbconn.each(stmt,function(err,row){
            dbconn.exec("BEGIN");
            if(row['count(*)']==0){
                var stmt = dbconn.prepare("INSERT INTO Stack VALUES (?,?,?)", [newDate,property,cellValue]);
                res.send("Inserted")

            }
            else{
                var stmt = dbconn.prepare("UPDATE Stack SET TIMESTAMP=?,value=? where \"config name\"=?", [newDate,cellValue,property]);
                res.send("Updated")
            }
            stmt.run();
            stmt.finalize();
            dbconn.exec("COMMIT");
        }),function(){

        }


    })

};

exports.getUnitData = function (req,res) {
    var obj=[],props,vals;
    var db= new sqlite3.Database('MASTER.db');
    db.serialize(function(){
      db.each("select * from Stack",function(err,row){
          props=row['config name']

          vals=row['value']
      //  obj.push( {property:row['config name'],value:row['value']})
            obj.push({paramvals:vals})
      },function(){
              res.send(obj)
              obj.length=0;
              obj=null;
          });
    });
};


exports.getallModules = function (req, res) {
    var obj = []
    var db= new sqlite3.Database('MASTER.db');
    db.serialize(function(){
        db.each("select * from Module",function(err,row){

            if(row.ENABLED=='true') {
                  obj.push(row);
//                obj.push({name: row['NAME'], FileName: row['FILE NAME'], DATETIME: row['DATE TIME ACTIVATION'], ENABLED: row['ENABLED']})
            }
        },function(){
            res.send(obj)
            obj.length=0
            obj=null;
        });
    });

};
var name;
exports.getModuleByName= function (req,res){

    var db= new sqlite3.Database('MASTER.db');
    db.serialize(function(){
       db.each("select * from Module where NAME='"+[req.params.modulename]+"'",function(err,row){
           name= row['FILE NAME'];
       },function(){

                    if(path.existsSync(dbpath+name)) {

                        getOneShot(name, req, res);

                    }
                    else{
                        res.send({})
                    }

       });
    });
    db.close();

};


