const express = require('express');
const bodyParser = require('body-parser');
const mongodb = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const multiparty = require('connect-multiparty');
const fs = require('fs');


const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(multiparty());

app.use((req, res, next)=>{

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "content-type");
    res.setHeader("Access-Control-Allow-Credentials", true);

    next();
});

var db = new mongodb.Db(
    'instagram',
    new mongodb.Server('localhost', 27017, {}),
    {}
)


const port = 8080;
app.listen(port);
console.log('Servidor HTTP está escutando a porta ' + port);


app.get('/', (req, res) =>{
    res.send({ msg: 'Olá' });
});


// POST - (create)

app.post('/api', (req, res) => {

    var date = new Date();
    timeStamp = date.getTime();
    
    var url_imagem = timeStamp + '_' + req.files.arquivo.originalFilename;
    var pathOrigin = req.files.arquivo.path;
    var pathTarget = './uploads/' + url_imagem;

    fs.rename(pathOrigin, pathTarget, function(err){
        if(err){
            res.status(500).json({error: err});
            return;
        };

        var dados = {
            url_imagem: url_imagem,
            titulo: req.body.titulo,
        };

        db.open( (err, mongoClient) => {
            mongoClient.collection('postagens', (err, collection)=> {
                collection.insert(dados, (err, records)=> {
                    if(err){
                        res.json('erro');
                    }else{
                        res.json('inclusão bem sucedida!');
                    }
                    mongoClient.close();
                });
            });
        });
    });  
});

// GET - (read)

app.get('/api', (req, res) => {
    
    db.open( (err, mongoClient) => {
        mongoClient.collection('postagens', (err, collection)=> {
            collection.find().toArray((err, results) => {
                if(err){
                    res.json(err);
                } else {
                    res.json(results);
                };
                mongoClient.close();
            });
        });
    });
});

app.get('/uploads/:imagem', (req, res) => {
    var img = req.params.imagem;

    fs.readFile('./uploads/' + img, (err, content) => {
        if(err){
            res.status(400).json(err);
            return;
        }
        res.writeHead(200, { 'content-type' : 'image/jpg' });
        res.end(content);
    })
})

// GET by ID - (read)

app.get('/api/:id', (req, res) => {
     
    db.open( (err, mongoClient) => {
        mongoClient.collection('postagens', (err, collection)=> {
            collection.find(ObjectId(req.params.id)).toArray((err, results) => {
                if(err){
                    res.json(err);
                } else {
                    res.status(200).json(results);
                };
                mongoClient.close();
            });
        });
    });
});

// PUT - (update)

app.put('/api/:id', (req, res) => {
    
    db.open( (err, mongoClient) => {
        mongoClient.collection('postagens', (err, collection)=> {
            collection.update(
                { _id : ObjectId(req.params.id) },
                { $push :   {
                                comentarios : {
                                    id_comentario : new ObjectId(),
                                    comentario : req.body.comentario
                                },
                            },
                },               
                {},
                (err, records) => {
                    if(err){
                        res.json(err);
                    } else {
                        res.json(records);
                    }
                    mongoClient.close()
                },
            );
        });
    });
});

// DELETE by ID - (remove)

app.delete('/api/:id', (req, res) => {
     
    db.open( (err, mongoClient) => {
        mongoClient.collection('postagens', (err, collection)=> {
            collection.remove({ _id : ObjectId(req.params.id) }, (err, records) => {
                if(err) {
                    res.json(err);   
                } else {
                    res.json(records);
                }
                mongoClient.close()
            })
        });
    });
});
