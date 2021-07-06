var WebSocket = require("ws");
var os = require("os");
const axios = require("axios");
const http = require("http");
const disk = require("node-disk-info");
const psList = require('ps-list');
const fs = require('fs');
const path = require('path');

const serverAddress = "ws://127.0.0.1:3000";

const ws = new WebSocket(serverAddress);
ws.on('open' , function(){
    console.log("Connection Established");

})

var counter = 1;

const id = Math.floor(Math.random() * 999999);

const ser = "http://localhost:5000";

function sendPostReq(url, type, value){
    axios.post(ser + url , {
        id : id,
        type : type,
        info :  value
    }).then((data) =>{
        console.log(data);
    }).catch((error) => {
        console.log(error);
        setInterval(() => {
            sendPostReq(url,type,value);
        }, 60000);
    });
}

function sendCPU(){
    sendPostReq('cpuusage', 'cpu', os.cpus());
}


function sendDisk(){
    sendPostReq("/disk" , "disk" , disk.getDiskInfoSync())
}

function sendRAM(){
    sendPostReq("/ramusage" , "ram" ,   {freemem : os.freemem() , totalmem : os.totalmem()} )

}

function sendProcesses(){
    
    (async () => {

        const data  = await psList();
        //=> [{pid: 3213, name: 'node', cmd: 'node test.js', ppid: 1, uid: 501, cpu: 0.1, memory: 1.5}, …]
        sendPostReq("/process" , "process" , data.length )
        
    })();

    
}

function sendDir(){
    const directoryPath = path.join(__dirname, '');
    
    fs.readdir(directoryPath, (err, files) => {
        if(err){
            console.log("error reading files");
        } else {
            console.log(" reading files");
            sendPostReq("/dir" , "dir" , files.length)

        }
    });
}

ws.on("ping" , function(msg){  
    console.log("Data Requested - " + counter++)
    // sendCPU();
    // sendDisk();
    //sendRAM();
    //sendProcesses();
    sendDir();
    // ws.send(JSON.stringify(obj));
    //if error put it in local list 
});