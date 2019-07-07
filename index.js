const express = require('express');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const bodyParser = require('body-parser');
const Grid = require('gridfs-stream');
const methodOverride = require('method-override');

const app = express();
app.use(bodyParser.json());
app.use(methodOverride('_method'))

app.set('view engine','ejs');

// Mongo Url of MLab
const mongoUrl = "mongodb+srv://kiran:kiran123@mongocluster-v2xjw.mongodb.net/test?retryWrites=true&w=majority";

// create Mongo Connection
const  conn = mongoose.createConnection(mongoUrl);

// init gridfs
let gfs ;
conn.once('open',()=>{
    gfs = Grid(conn.db , mongoose.mongo);
    gfs.collection('uploads');
})


// Create storage engine

const storage = new GridFsStorage({
    url: mongoUrl,
    file: (req, file) => {
      return new Promise((resolve, reject) => {
        crypto.randomBytes(16, (err, buf) => {
          if (err) {
            return reject(err);
          }
          const filename = buf.toString('hex') + path.extname(file.originalname);
          const fileInfo = {
            filename: filename,
            bucketName: 'uploads'
          };
          resolve(fileInfo);
        });
      });
    }
  });
  const upload = multer({ storage });



    // @Route GET/
    // @Desc Loads form
    app.get('/',(req,res)=>{
        gfs.files.find().toArray((err,files)=>{
            if(!files || files.length ===0){
                res.render('index',{files : false});
            }
            else
            {
                files.map(file=>{
                    if(file.contentType === 'iamge/jpeg' || file.contentType ==='image/png')
                    {
                        file.isImage = true;
                    }
                    else
                    {
                        file.isImage = false;
                    }
                })
                return res.render('index',{files:files});
            }
          
        })

    
    });


    // @Route POST /uploads
    // @Desc  Uploads files to DB

    app.post('/upload',upload.single('file'),(req,res)=>{
        //res.json({ 'file' : req.file})
        res.redirect('/')
    });

    // @Route GET /files
    // @Desc  Display all files in json

    app.get('/files',(req,res)=>{
     gfs.files.find().toArray((err,files)=>{
         if(!files || files.length ===0){
            return res.status(404).json({err :'No files exist'});
         }
         return res.json(files);
     })
    });


    // @Route GET /files/:filename
    // @Desc  Display one file in json

    app.get('/files/:filename',(req,res)=>{
        gfs.files.findOne({filename : req.params.filename},(err,file)=>{
            if(!file || file.length ===0){
               return res.status(404).json({err :'No files exist'});
            }
            return res.json(file);
        })
       });
   
    // @Route GET /image/:filename
    // @Desc  Display one file in image format

    app.get('/image/:filename',(req,res)=>{
        gfs.files.findOne({filename : req.params.filename},(err,file)=>{
            if(!file || file.length ===0){
               return res.status(404).json({err :'No files exist'});
            }
            //check if an image
            if(file.contentType === 'image/jpeg' ||file.contentType === 'image/jpg' || file.contentType === 'image/png' )
                {
                    const readStream = gfs.createReadStream(file.filename);
                    readStream.pipe(res);

                }
                else
                {
                    res.status(404).json({err : 'Not an Image'});
                }
        })
       });

       

    // @Route DELETE /files/:id
    // @Desc Delete file by name

    app.delete('/files/:id',(req,res)=>{
        gfs.remove({_id : req.params.id,root : 'uploads'},(err,gridstore)=>{
            if(err)
            {
                return res.status(404).json({err:err});
            }
            else
            {

                res.redirect('/')
            }

        })
    })

const port = 3001;

app.listen(port,()=>console.log(`Server started on port ${port} `));