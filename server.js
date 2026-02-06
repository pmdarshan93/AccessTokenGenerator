const express = require('express')
const path = require('path')
const app = express();
const port = 2507;
const cors =require('cors');

const queryString = require('querystring')
const { connection } = require('./public/utils/dbConnection');

app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));




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
    try {
        let clientList = await getAllClients();
        res.json({"data" :clientList});
    } catch (err) {
        console.log(err)
        res.sendStatus(500);
    }
})

app.post("/addClient", async (req, res) => {
    let { name, description, client_id, client_secret } = req.body;
    try {
        let storeStatus = await addClientInDb(name, description, client_id, client_secret);
        res.sendStatus(storeStatus)
    } catch (err) {
        console.log(err)
        res.sendStatus(500)
    }
})

app.get("/getAllProjects", async (req, res) => {
    let { clientId } = req.query;
    try {
        let projectList = await getProjectList(clientId);
        res.json(projectList);
    } catch (err) {
        console.log(err);
        res.sendStatus(500)
    }
})


app.post("/addProject", async (req, res) => {
    let { name, description, scope, clientId, autoRegeneration } = req.body;
    try {
        let uniqueStatus = await checkDuplicateProject(name);
        if (uniqueStatus) {
            let insertId = await createProjectInDb(name, description, scope, clientId, autoRegeneration);
            if (insertId) {
                let clientDetails = await getClientDetailsFromDB(clientId);
                let client_id = clientDetails.client_id
                return res.json({ client_id, insertId });
            }
            res.sendStatus(404);
        }
        res.sendStatus(409);
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
})

app.get('/newProject', async (req, res) => {
    let code = req.query.code;
    console.log(code);
    try {
        let clientDetails = await getClientDetailsFromDB(1);
        let tokens = await genrateTokens(code, clientDetails.client_id, clientDetails.client_secret);
        console.log(tokens);
        let createStatus = await createTokenInDB(tokens, 1);
        if (createStatus) {
            return res.sendStatus(200)
        }
        res.sendStatus(404);
    } catch (err) {
        console.log(err)
        res.sendStatus(500);
    }
})

app.post('/editClient', async (req, res) => {
    let { name, description, clientId } = req.body;
    try {
        let updateStatus = await updateClientInDb(name, description, clientId);
        res.sendStatus(updateStatus ? 200 : 404);
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
})

app.post("/deleteClient", async (req, res) => {
    let { clientId, reason } = req.body;
    try {
        let deleteStatus = await deleteClient(clientId, reason);
        if (deleteStatus) {
            return res.sendStatus(200);
        }
        res.sendStatus(404)
    } catch (err) {
        console.log(err);
        res.sendStatus(500)
    }
})

app.get("/getProjectsOfClient", async (req, res) => {
    let { clientId } = req.query;
    try {
        let list = await getProjectOfClient(clientId);
        res.json(list);
    } catch (err) {
        console.log(err);
        res.sendStatus(500)
    }
})

app.post("/editProject", async (req, res) => {
    let { name, description, auto_regeneration, project_id } = req.body;
    try {
        let editStatus = updateProjectInDb(name, description, auto_regeneration, project_id);
        if (editStatus) {
            return res.sendStatus(200)
        }
        res.sendStatus(404)
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
})

app.post("/deleteProject", async (req, res) => {
    let { project_id, reason } = req.body;
    try {
        let deleteStatus = await deleteProject(project_id, reason);
        if (deleteStatus) {
            return res.sendStatus(200)
        }
        res.sendStatus(404);
    } catch (err) {
        console.log(err);
        res.sendStatus(500)
    }
})

app.post("/regenerateToken", async (req, res) => {
    let { projectId } = req.body;
    try {
        let tokens = await getTokenFromDb(projectId);
        let project = await getProjectDetailsFromDb(projectId);
        let client = await getClientDetailsFromDB(project.client_id);
        let newAccessToken = await regenerateToken(client.client_id, client.client_secret, tokens.refreshToken);
        let updateStatus = await updateAccessToken(tokens.token_id, newAccessToken);
        if (updateStatus) {
            return res.json(newAccessToken);
        }
        res.sendStatus(404);
    } catch (err) {
        console.log(err)
        res.sendStatus(500);
    }
})

app.post("/restoreClient", async (req, res) => {
    let { trashId } = req.body;
    try {
        let restoreStatus = await restoreClient(trashId);
        if (restoreStatus) {
            return res.sendStatus(200);
        }
        res.sendStatus(404);
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
})

app.post("/restoreProject", async (req, res) => {
    let { trashId } = req.body;
    try {
        let projectId = await restoreProject(trashId);
        if (projectId) {
            let project = await getProjectDetailsFromDb(projectId);
            let clientDetails = await getClientDetailsFromDB(project.client_id);
            return res.json({
                clientId: clientDetails.client_id,
                scope : project.scope,
                "projectId" : project.project_id
            });
        }
        res.sendStatus(404);
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
})

app.post("/editScope",async (req,res)=>{
    let {projectId,scope} = req.body;
    try{
        let updateStatus = await updateScopeInDb(projectId,scope); 
        if(updateStatus){
        let projectDetails= await getProjectDetailsFromDb(projectId);
        let clientDetails = await getClientDetailsFromDB(projectDetails.client_id);
        res.json(clientDetails.client_id);
        }
    }catch(err){
        console.log(err);
        reject(500);
    }
})

// ========================== DB

async function getAllClients() {
    let query = "select * from client where is_trashed=false";
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
    let query = "select * from project p join token t on p.id=t.project_id  where p.client_id = ? and p.is_trashed=false";
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

async function checkDuplicateProject(project) {
    let query = "select * from project where name = ?";
    return new Promise((resolve, reject) => {
        connection.query(query, [project], (err, result) => {
            if (err) {
                console.log("CHECK DUPLICATE PROJECT ERROR \n", err);
            }
            resolve(result.length === 0);
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

async function createTokenInDB(token, projectId) {
    let alreadyExist="select * from project where project_id = ?";
    let query = "insert into token (access_token,refresh_token,created_time,project_id) values (?,?,?,?)";
    let update = "update token set access_token = ?,refresh_token = ?,created_time =?";
    return new Promise((resolve, reject) => {
        connection.query(alreadyExist,[projectId],(err,result)=>{
        if(err){
            console.log("CREATE TOKEN DUPLICATE CHECK ERROR",err)
            reject(500);
        }
        if(result.length==0){
            connection.query(query, [token.access_token, token.refresh_token, new Date().getTime(), projectId], (err, result) => {
                if (err) {
                    console.log("CREATE TOKEN IN DB ERROR \n", err);
                    reject(500)
                }
                resolve(result.affectedRows == 1);
            })
        }else{
            connection.query(update,[token.access_token,token.refresh_token,new Date().getTime()],(err,result)=>{
                if(err){
                    console.log("UPDATE TOKEN CREATE TOKEN ERR\n",err);
                    reject(500);
                }
                resolve(result.affectedRows>1);
            })
        }
        })
    })
}

async function updateClientInDb(name, description, client_id) {
    let query = "update client set name =?,description = ? where id = ?";
    return new Promise((resolve, reject) => {
        connection.query(query, [name, description, client_id], (err, result) => {
            if (err) {
                console.log("UPDATE CLIENT IN DB ERROR\n", err)
                reject(500)
            }
            resolve(result.affectedRows == 1);
        })
    })
}




async function deleteClient(clientId, reason) {
    let query = "update client set is_trashed=true where id = ?";
    let trashQuery = "insert into client_trash (deleted_date,reason,client_id) values (?,?,?)"
    return new Promise((resolve, reject) => {
        connection.beginTransaction((err) => {
            if (err) {
                console.log("DELETE CLIENT TRANSACTION ERROR", err);
                reject(500);
            }

            connection.query(query, [clientId], (err, result) => {
                if (err) {
                    console.log("DELETE CLIENT UPDATE IS TRASHED ERROR\n", err);
                    return connection.rollback(() => reject(500));
                }
                if (result.affectedRows == 1) {
                    connection.query(trashQuery, [new Date(), reason, clientId], (errr, result2) => {
                        if (errr) {
                            console.log("INSERT IN CLIENT TRASH ERROR \n", errr);
                            return connection.rollback(() => reject(500));
                        }
                        if (result2.affectedRows === 1) {
                            connection.commit((err) => {
                                if (err) {
                                    console.log("DELETE CLIENT TRANSACTION COMMIT ERROR", err);
                                    return connection.rollback(() => reject(500));
                                }
                                resolve(true);
                            })
                        } else {
                            return connection.rollback(() => reject(500))
                        }
                    })
                }
            })
        })
    })
}

async function getProjectOfClient(clientId) {
    let query = "select * from client c join project p on c.id = p.client_id where c.id = ? ";
    return new Promise((resolve, reject) => {
        connection.query(query, [clientId], (err, result) => {
            if (err) {
                console.log("GET PROJECT OF CLIENT ERROR \N", err);
                reject(500);
            }
            resolve(result);
        })
    })
}

async function updateProjectInDb(name, description, auto_regeneration, project_id) {
    let query = "update project set name=? , description = ?,auto_regeneration=? where project_id = ?";
    return new Promise((resolve, reject) => {
        connection.query(query, [name, description, auto_regeneration, project_id], (err, result) => {
            if (err) {
                console.log("UPDATE PROJECT IN DB ERROR", err);
                reject(500);
            }
            resolve(result.affectedRows === 1);
        })
    })
}

async function deleteProject(projectId, reason) {
    let query = "update project set is_trashed=true where project_id = ?";
    let trashQuery = "insert into project_trash (deleted_date,reason,project_id) values (?,?,?)"
    let tokenQuery = "delete from token where project_id = ?"
    return new Promise((resolve, reject) => {
        connection.beginTransaction((err) => {
            if (err) {
                console.log("DELETE PROJECT TRANSACTION ERROR", err);
                reject(500);
            }
            connection.query(query, [projectId], (err, result) => {
                if (err) {
                    console.log("DELETE PROJECT ERROR", err);
                    return connection.rollback(() => reject(500));
                }
                if (result.affectedRows === 1) {
                    connection.query(trashQuery, [new Date(), reason, projectId], (errr, result2) => {
                        if (errr) {
                            console.log("INSERT IN PROJECT TRASH ERROR", err)
                            return connection.rollback(() => reject(500));
                        }
                        if (result2.affectedRows === 1) {
                            connection.query(tokenQuery, projectId, (err3, result3) => {
                                if (err3) {
                                    console.log("TOKEN DELETE ERR", err)
                                    return connection.rollback(() => reject(500));
                                }
                                if (result3.affectedRows === 1) {
                                    connection.commit((err) => {
                                        if (err) {
                                            console.log("DELETE PROJECT COMMIT ERROR\n", err)
                                            return connection.rollback(() => reject(500))
                                        }
                                        resolve(true);
                                    })
                                } else {
                                    return connection.rollback(() => reject(500));
                                }
                            })
                        };
                    })
                }
            })
        })
    })
}

async function getTokenFromDb(projectId) {
    let query = "select * from token where project_id = ? and is_trashed = false";
    return new Promise((resolve, reject) => {
        connection.query(query, [projectId], (err, result) => {
            if (err) {
                console.log("GET PROJECT DETAIL ERROR", err);
            }
            resolve(result[0]);
        })
    })
}

async function getProjectDetailsFromDb(projectId) {
    let query = "select * from project where project_id = ? and is_trashed = false";
    return new Promise((resolve, reject) => {
        connection.query(query, [projectId], (err, result) => {
            if (err) {
                console.log("GET PROJECT DETAILS ERR\n", err)
                reject(500);
            }
            resolve(result[0]);
        })
    })
}

async function updateAccessToken(tokenId, accessToken) {
    let query = "update tokens set access_token = ? where token_id = ?";
    return new Promise((resolve, reject) => {
        connection.query(query, [accessToken, tokenId], (err, result) => {
            if (err) {
                console.log("UPDATE ACCESS TOKEN ERROR", err)
                reject(500)
            }
            resolve(result.affectedRows === 1);
        })
    })
}

async function restoreClient(trashId) {
    let query = "select client_id from client_trash where trash_id = ?";
    let restoreQuery = "update client set is_trashed= false where id = ?";
    let deleteTrash = "delete from client_trash where trash_id = ?";
    return new Promise((resolve, reject) => {
        connection.beginTransaction((err) => {
            if (err) {
                console.log("RESTORE CLIENT TRANSACTION ERROR \n", err);
                reject(500);
            }
            connection.query(query, trashId, (err, result) => {
                if (err) {
                    console.log("RESTORE CLIENT GET CLIENT ID ERR", err);
                    return connection.rollback(() => reject(500));
                }
                let clientDetails=result[0]
                connection.query(restoreQuery, [clientDetails.client_id], (errr, result2) => {
                    if (errr) {
                        console.log("RESTORE CLIENT ERROR\n", errr);
                        return connection.rollback(() => reject(500));
                    }
                    connection.query(deleteTrash, [trashId], (errrr, result3) => {
                        if (errrr) {
                            console.log("DELETE FROM TRASH", errrr);
                            return connection.rollback(() => reject(500));
                        }
                        if (result3.affectedRows === 1) {
                            connection.commit((err) => {
                                if (err) {
                                    connection.rollback(() => reject(500));
                                }
                                resolve(true);
                            })
                        }
                    })
                })
            })
        })
    })
}


async function restoreProject(trashId) {
    let query = "select project_id from project_trash where trash_id = ?";
    let restoreQuery = "update project set is_trashed= false where project_id = ?";
    let deleteTrash = "delete from project_trash where trash_id = ?";
    return new Promise((resolve, reject) => {
        connection.beginTransaction((err) => {
            if (err) {
                console.log("RESTORE PROJECT TRANSACTION ERROR\n", err)
                reject(500);
            }
            connection.query(query, [trashId], (err, result) => {
                if (err) {
                    console.log("GET PROJECT iD ERROR\n", err);
                    return connection.rollback(() => reject(500))
                }
                let projectDetails=result[0]
                connection.query(restoreQuery, [projectDetails.project_id], (err2, result2) => {
                    if (err2) {
                        console.log("UPDATE PROJECT IS TRASHED ERR\n", err2);
                        return connection.rollback(() => reject(500));
                    }
                    if (result2.affectedRows === 1) {
                        connection.query(deleteTrash,[trashId],(err3,result3)=>{
                            if(err3){
                                console.log("DELETE PROJECT TRASH ERROR",err3);
                                connection.rollback(()=>{reject(500)})
                            }
                            if(result3.affectedRows==1){
                                connection.commit((err4) => {
                                    if (err4) {
                                        console.log("UPDATE PROJECT COMMIT ERROR", err);
                                        return connection.rollback(() => reject(500))
                                    }
                                    resolve(result[0]);
                                })
                            }
                        })
                    } else {
                        return connection.rollback(() => reject(500));
                    }
                })
            })
        })
    })
}

async function updateScopeInDb(projectId,scope){
    let query="update project set scopes= ? where project_id =?";
    return new Promise((resolve,reject)=>{
        connection.query(query,[scope,projectId],(err,result)=>{
            if(err){
                console.log("UPDATE SCOPE IN DB ERR\n",err);
                reject(500);
            }
            resolve(result.affectedRows===1);
        })
    })
}

//============================================

async function genrateTokens(grandToken, clientId, clientSecret) {
    let response = await fetch("https://accounts.zoho.in/oauth/v2/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: queryString.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: "authorization_code",
            code: grandToken,
            redirect_uri: "http://localhost:2507/newProject"
        })
    })
    let object = await response.json();
    return object;
}

async function regenerateToken(clientId, clientSecret, refreshToken) {
    let response = await fetch("https://accounts.zoho.in/oauth/v2/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: queryString.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: "refresh_token",
            refresh_token: refreshToken
        })
    })
    let newToken = await response.json();
    console.log(newToken)
    return newToken.access_token;
}
