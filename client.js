const WebSocket = require("ws");
const os = require("os");
const axios = require("axios");
const http = require("http");
const disk = require("node-disk-info");
const psList = require('ps-list');
const fs = require('fs');
const path = require('path');

//web socket client connection to localhost port 3000 
const serverAddress = "ws://127.0.0.1:3000";

const ws = new WebSocket(serverAddress);

//opens the websocket connection for client side
ws.on('open' , function(){
    console.log("Connection Established");
})

//counter variable to keep count of request sent by server 
var counter = 1;

//random id associated to identify unique client
//currently a random variable but can be set to session id or any other unique id 
const id = Math.floor(Math.random() * 999999);

//server connection to send data at localhost port 5000
//in real application will be set to ip address of the server 
const ser = "http://localhost:5000";

//function to send post request to server
//sends id , type of requests by server and info about type of request 
//type : cpu usage , ram usage ,directory details ,no. of process running
//If error in servicing the request request is again sent after an interval with previous values
//this achieves simpe caching mechanism  
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
//send cpu usage request using the sendPostReq function
function sendCPU(){
    sendPostReq('/cpuusage', 'cpu', os.cpus());
}


//send Disk space left using node-disk-info library
function sendDisk(){
    sendPostReq("/disk" , "disk" , disk.getDiskInfoSync())
}

//send RAM usage request using the sendPostReq function
function sendRAM(){
    sendPostReq("/ramusage" , "ram" ,   {freemem : os.freemem() , totalmem : os.totalmem()} )

}

//send No of process running request in the cpu 
function sendProcesses(){
    (async () => {
        const data  = await psList();
        sendPostReq("/process" , "process" , data.length )        
    })();
}

//send no of files and directory of requested directory
//currently hardcoded to get details about current working directory
//can be made to serve the directory asked by the server  
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

//client sockets is pinged to request data from the client every n minutes
//on each ping client calls requested function and posts it to server
//currenlty serving all the requests but can be made to serve specific requests
//using switch or if else conditions in the below function
ws.on("ping" , function(msg){  
    console.log("Data Requested - " + counter++)
    sendCPU();
    sendDisk();
    sendRAM();
    sendProcesses();
    sendDir();
});