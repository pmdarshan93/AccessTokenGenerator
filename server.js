const express = require('express')
const path = require('path')
const app = express();
const port = 2507;

const queryString = require('querystring')
const { connection } = require('./public/utils/dbConnection');

app.use(express.static(path.join(__dirname, "public")))
app.set("views", path.join(__dirname, 'public/views'))
app.use(express.json());

app.listen(port, (err) => {
    if (err)
        console.log(err)
    console.log("Server is running on port 2507")
})

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "views", "index.html"))
})

app.get("/AllClients", async (req, res) => {
    try{
    let clientList = await getAllClients();
    res.json(clientList);
    }catch(err){
        res.sendStatus(err);
    }
})

app.post("/addClient", async (req, res) => {
    let { name, description, client_id, client_secret } = req.body;
    try {
        let storeStatus = await addClientInDb(name, description, client_id, client_secret);
        res.sendStatus(storeStatus)
    } catch (err) {
        console.log(err)
        res.sendStatus(err)
    }
})

app.get("/getAllProjects", async (req, res) => {
    let { client_id } = req.query;
    try{
    let projectList = await getProjectList(client_id);
    res.json(projectList);
    }catch(err){
        res.sendStatus(err)
    }
})


app.post("/addProject", async (req, res) => {
    let { name, description, scope, clientId, autoRegeneration } = req.body;
    try {
        let uniqueStatus= await checkDuplicateProject(name);
        if(uniqueStatus){
        let insertId = await createProjectInDb(name, description, scope, clientId, autoRegeneration);
        if (insertId) {
            let clientDetails = await getClientDetailsFromDB(clientId);
            let client_id = clientDetails.client_id
            return res.json({client_id,insertId});
        }
        res.sendStatus(404);
    }
        res.sendStatus(409);
    } catch (err) {
        console.log(err);
        res.sendStatus(err);
    }
})

app.get('/newProject',async  (req, res) => {
    let code = req.query.code;
    console.log(code);
    try{
    let clientDetails=await getClientDetailsFromDB(1);
    let tokens = await genrateTokens(code,clientDetails.client_id,clientDetails.client_secret);
    console.log(tokens);
    let createStatus = await createTokenInDB(tokens,1);
    if(createStatus){
    return res.sendStatus(200)
    }
    res.sendStatus(404);
    }catch(err){
        console.log(err)
        res.sendStatus(500);
    }
})


// app.get('/getAllProjects',async(req,res)=>{
//     try{
//         let allProjects = await getAllProjectsFromDb();
//         res.json(allProjects)
//     }catch(err){
//         res.sendStatus(err)
//     }
// })


app.post("/storeData",async (req,res)=>{
    let {clientId, clientSecret}=req.body
    try{
    let store = await storeDataInDb(clientId,clientSecret);
    let id = await getLength();
    return res.status(200).json(id.length);
    }catch(err){
    // return res.sendStatus(err)
    }
})

// app.get("/scope",(req,res)=>{
//     res.sendFile(path.join(__dirname, "public", "views", "scope.html"))
// })

// app.post("/getCredentials",async (req,res)=>{
//     let {scope,project} = req.body
//     try{
//     let status = await checkDuplicateInDb(project);
//     if(status){
//         let updateStatus= await updateScopeInDb(scope,project);
//         if(updateStatus){
//         let details= await getDetailsFromDb();
//         let clientId=details.client_id;
//         res.json({"clientId":clientId})
//         }
//     }else{
//         res.sendStatus(409)
//     }
//     }catch(err){
//         res.sendStatus(err)
//     }

// })


// app.post('/getLastGenratedToken',async(req,res)=>{
//     res.json(await getDetailsFromDb());
// })

// app.get("/getToken",async(req,res)=>{
//     let code = req.query.code
//     let details = await getDetailsFromDb();
//     console.log(details)
//     // let tokenAlreadyCreated= await verifyAccessToken();
//     // if(!tokenAlreadyCreated){
//     let tokens=await genrateTokens(code,details.client_id,details.client_secret);
//     console.log(tokens);
//     try{
//     let status= await storeTokensInDb(tokens);
//     if(!status){
//         res.sendStatus(405);
//     }
//     }catch(err){
//         res.sendStatus(err)
//     }
// // }
//     res.sendFile(path.join(__dirname, "public", "views", "token.html"))
// })

// app.post('/regenrateAccessToken',async(req,res)=>{
//     let {project_name,scope}=req.body;
//     try{
//     let details = await getDetailsFromDbForProjectAndScope(project_name,scope);
//     let token = await genrateAccessToken(details.client_id,details.client_secret,details.refresh_token);
//     // let token = "1000.a44553af20eab4ace9bb8a73cd9c9d17.663f1b8ff66bb06427d2d7bcd5bf2af1"
//     let update =await  updateAccessTokenInDb(token,project_name,scope);
//     console.log(token);
//     if(update){
//     let details = await getDetailsFromDbForProjectAndScope(project_name,scope);
//       return  res.json(details)
//     }
//     res.sendStatus(500);
//     }catch(err){
//         res.sendStatus(err);
//     }
// })


// ========================== DB

async function getAllClients() {
    let query = "select * from client";
    return new Promise((resolve, reject) => {
        connection.query(query, (err, result) => {
            if (err) {
                console.log("GET ALL CLIENT FROM DB ERRORn\n", err)
                reject(500)
            }
            resolve(result);
        })
    })
}

async function addClientInDb(name, description, client_id, client_secret) {
    let uniqueStatus = await checkDuplicateClientId(client_id);
    return new Promise((resolve, reject) => {
        if (uniqueStatus) {
            let query = "insert into client (name,description,client_id,client_secret) values (?,?,?,?)";
            connection.query(query, [name, description, client_id, client_secret], (err, result) => {
                if (err) {
                    console.log("ADD CLIENT IN DB ERROR\n", err)
                    reject(500);
                }
                if (result.affectedRows === 1) resolve(200);
            })
        }
        else {
            resolve(409);
        }
    })

}

async function checkDuplicateClientId(client_id) {
    let query = "select * from client where client_id = ?";
    return new Promise((resolve, reject) => {
        connection.query(query, [client_id], (err, result) => {
            if (err) {
                console.log("CHECK DUPLICATE CLIENT ID ERROR", err)
                reject(500)
            }
            resolve(result.length == 0);
        })
    })
}

async function getProjectList(client_id) {
    console.log(client_id);
    let query = "select * from project p join token t on p.id=t.project_id  where p.client_id = ?";
    return new Promise((resolve, reject) => {
        connection.query(query, [client_id], (err, result) => {
            if (err) {
                console.log("GET ALL PROJECT CLIENT ID ERROR\n", err);
                reject(500);
            }
            resolve(result[0]);
        })
    })
}

async function checkDuplicateProject(project){
    let query = "select * from project where name = ?";
    return new Promise((resolve,reject)=>{
        connection.query(query,[project],(err,result)=>{
            if(err){
                console.log("CHECK DUPLICATE PROJECT ERROR \n",err);
            }
            resolve(result.length===0);
        })
    })
}

async function createProjectInDb(name, description, scope, clientId, autoRegeneration) {
    let query = "insert into project (name,description,scopes,auto_regeneration,client_id) values (?,?,?,?,?)";
    return new Promise((resolve, reject) => {
        connection.query(query, [name, description, scope, autoRegeneration, clientId], (err, result) => {
            if (err) {
                console.log(" CREATE PROJECT IN Db ERROR", err);
                reject(500);
            }
            resolve(result.insertId);
        })
    })
}

async function getClientDetailsFromDB(clientId) {
    let query = "select * from client where id = ?";
    return new Promise((resolve, reject) => {
        connection.query(query, [clientId], (err, result) => {
            if (err) {
                console.log("GET CLIENT ID FROM DB ERROR \n", err);
                reject(500);
            }
            resolve(result[0]);
        })
    })
}

async function createTokenInDB(token,projectId){
    let query = "insert into token (access_token,refresh_token,created_time,project_id) values (?,?,?,?)";
    return new Promise((resolve,reject)=>{
        connection.query(query,[token.access_token,token.refresh_token,new Date().getTime(),projectId],(err,result)=>{
        if(err){
            console.log("CREATE TOKEN IN DB ERROR \n",err);
            reject(500)
        }
        resolve(result.affectedRows==1);
    })
})
}

// async function addProject(name,description,scope){
//     let query="insert into project "
// }

// async function getAllProjectsFromDb(){
//     let query= "select project_name,scope,refresh_token,access_token,created_time from  userTokens";
//     return new Promise((resolve,reject)=>{
//         connection.query(query, (err,result)=>{
//         if(err){
//             console.log(err)
//             return reject(505)
//         }
//         resolve(result)
//     })
//     })
// }

// async function storeDataInDb(clientId,clientSecret){
//     let query = "insert into userTokens ( access_token,refresh_token,client_id,client_secret,created_time)values (?,?,?,?,?)"
//     return new Promise((resolve,reject)=>{
//         connection.query(query,[null,null,clientId,clientSecret,null],(err,result)=>{
//         if(err){
//             console.log(err)
//             reject(505)
//         }
//         console.log(result)
//         resolve(200)
//         // res.redirect('/get_refresh_token')
//     })
// })
// }

// async function checkDuplicateInDb(project){
//     let query="select * from userTokens where project_name = ?";
//     return new Promise((resolve,reject)=>{
//         connection.query(query,[project],(err,result)=>{
//             if(err){
//                 console.log(err)
//                 reject(505)
//             }
//             resolve(result.length===0)
//         })
//     })
// }

// async function updateScopeInDb(scope,project){
//     let length=await getLength();
//     let query = "update userTokens set scope= ?,project_name = ? where id =?"
//     return new Promise((resolve,reject)=>{
//         connection.query(query,[scope,project,length.length],(err,result)=>{
//         if(err){
//             console.log(err);
//             reject(505)
//         }
//         console.log(result)
//         resolve(result.affectedRows===1)
//     })
//     });
// }

// async function getDetailsFromDb(){
//         let ans = await getLength();
//         let query = "select * from userTokens where id = ?";
//         return new Promise((resolve, reject) =>{
//             connection.query(query, [ans.length],(err,result)=>{
//             if(err){
//                 console.log(err)
//                 return reject(505)
//             }
//             resolve(result[0])
//         })
//     })
// }

// async function storeTokensInDb(tokens){
//     let query = "update userTokens set refresh_token = ?, access_token = ?,created_time = ? where id = ?";
//     let length = await getLength();
//     return new Promise((resolve,reject)=>{
//         connection.query(query,[tokens.refresh_token,tokens.access_token,new Date().getTime().toString(),length.length],(err,result)=>{
//         if(err){
//             console.log(err)
//             reject(505)
//         }
//         console.log(result)
//         resolve(result.affectedRows===1)
//     })
//     })
// }

// async function getDetailsFromDbForProjectAndScope(project_name,scope){
//     let query="select * from userTokens where project_name= ? and scope = ?";
//     return new Promise((resolve,reject)=>{
//         connection.query(query,[project_name,scope],(err,result)=>{
//             if(err){
//                 console.log(err);
//                 reject(505);
//             }
//             console.log(result);
//             resolve(result[0]);
//         })
//     })
// }


// function getLength(){
//     let query = "select count(*) as length from userTokens";
//     return new Promise((resolve,reject)=>{
//         connection.query(query,(err,result)=>{
//             if(err){
//                 console.log(err)
//                 reject(505)
//             }
//             resolve(result[0])
//         })
//     })
// }

// async function verifyAccessToken(){
//     let query = "select refresh_token as token from userTokens where id = ?";
//     let length = await getLength();
//     return new Promise( (resolve,reject)=>{
//         connection.query(query,[length.length],(err,result)=>{
//             if(err){
//                 console.log(err)
//                 reject(505);
//             }
//             console.log(result)
//             resolve(result[0].token!=null)
//         })
//     })
// }

// async function updateAccessTokenInDb(token,project_name,scope){
//     let query="update  userTokens set access_token = ?,created_time=? where project_name = ? and scope = ?";
//     return new Promise ( (resolve, reject)=>{
//         connection.query(query,[token,new Date().getTime().toString(),project_name,scope],(err,result)=>{
//             if(err){
//                 console.log(err);
//                 reject(505);
//             }
//             console.log(result);
//             resolve(result.affectedRows==1);
//         })
//     })
// }

//============================================

async function genrateTokens(grandToken,clientId,clientSecret){
let response = await fetch("https://accounts.zoho.in/oauth/v2/token",{
    method : "POST",
    headers : {
    "Content-Type": "application/x-www-form-urlencoded"
    },
    body :queryString.stringify({
        client_id : clientId,
        client_secret : clientSecret,
        grant_type : "authorization_code",
        code : grandToken,
        redirect_uri : "http://localhost:2507/newProject"
      })
})
let object = await response.json();
return object;
}

// async function genrateAccessToken(clientId,clientSecret,refreshToken){
// let response = await fetch("https://accounts.zoho.in/oauth/v2/token",{
//   method : "POST",
//   headers : {
//     "Content-Type": "application/x-www-form-urlencoded"
//   },
//   body : queryString.stringify({
//     client_id : clientId,
//     client_secret : clientSecret,
//     grant_type : "refresh_token",
//     refresh_token : refreshToken
//   })
// })
// let newToken = await response.json();
// console.log(newToken)
// return newToken.access_token;
// }




app.get("/clearProjectTrash",(req,res)=>{
    const query = "delete from project_trash";
    return new Promise((resolve,reject)=>{
        connection.query(query,(err,result)=>{
            if(err){
                console.log("CLEAR PROJECT TRASH ERROR \n",err);
            }
            console.log("RESULT : "+result)
            resolve(result.affectedRows==1);
        })
    })
})

app.get("/clearProjectTrash",(req,res)=>{
    const query = "delete from project_trash";
    return new Promise((resolve,reject)=>{
        connection.query(query,(err,result)=>{
            if(err){
                console.log("CLEAR PROJECT TRASH ERROR \n",err);
            }
            console.log("RESULT : "+result)
            resolve(result.affectedRows==1);
        })
    })
})

app.get("/clearClientTrash",(req,res)=>{
    const query = "delete from client_trash";
    return new Promise((resolve,reject)=>{
        connection.query(query,(err,result)=>{
            if(err){
                console.log("CLEAR PROJECT TRASH ERROR \n",err);
            }
            console.log("RESULT : "+result)
            resolve(result.affectedRows==1);
        })
    })
})