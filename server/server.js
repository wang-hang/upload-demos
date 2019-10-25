const express = require('express')
const path = require('path')
const multer = require('multer')
const fs = require('fs').promises

const app = express()

const uploadPath = path.resolve(__dirname, './uploads/')
const upload = multer({dest: uploadPath})


app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname,'../client/index.html' ))
})

app.get('/drag-upload', (req, res) => {
  res.sendFile(path.resolve(__dirname,'../client/drag-upload.html' ))
})

app.get('/paste-upload', (req, res) => {
  res.sendFile(path.resolve(__dirname,'../client/paste-upload.html' ))
})

app.get('/slice-upload', (req, res) => {
  res.sendFile(path.resolve(__dirname,'../client/slice-upload.html' ))
})

app.post('/upload', upload.single('photo'), (req, res) => {
  const suffix = getSuffix(req.file.originalname)
  const newFileName = `${Date.now()}-${req.file.fieldname}.${suffix}`
  const newPath = path.resolve(uploadPath, newFileName)
  fs.renameSync(req.file.path, newPath )
  res.send({
    path: newPath,
    name: newFileName,
  })
})

app.post('/slice-upload', upload.single('photo'), async (req, res) => {
  const index = req.body.index
  const tag = req.body.tag
  const newFileName = `${index}.${tag}`
  const oldPath = req.file.path
  const newPath = getTmpDirName(tag)
  try{
    await fs.access(newPath) // 目录已经创建
  }catch(err) {
    fs.mkdir(newPath) //目录还未创建
  }
  fs.rename(oldPath, path.resolve(newPath, newFileName))

  res.send({
    // path: newPath,
    // name: newFileName,
  })
})

app.get('/slice-upload-complete', async (req, res) => {
  const { tag, filename } = req.query
  const newFileName = tag + filename
  const tmpDirPath = getTmpDirName(tag)
  const filenames = await fs.readdir(tmpDirPath)
  const sortedFilenames = filenames.sort((x,y) => {
    const xIdx = +x.split('.')[0]
    const yIdx = +y.split('.')[0]
    return xIdx - yIdx
  } )
  const result = []
  for(let i= 0;i < sortedFilenames.length;i++){
    let data = await fs.readFile(path.resolve(tmpDirPath, sortedFilenames[i]))
    result.push(data)
  }
  const wholeFileBlob = Buffer.concat(result)
  fs.writeFile(path.resolve(uploadPath, newFileName), wholeFileBlob).then(res => {
    res.send('ok')
  })
  .catch(err => {
    res.send('failed')
  })
})

app.listen(8080, () => {
  console.log('server is start')
})



function getSuffix(filename){
  const tmp = filename.split('.')
  if(tmp.length < 1) throw Error('filename is wrong')
  return tmp.pop()
}


function getTmpDirName(tag){
  return path.resolve('./tmp', `tmp-${tag}/`) 
}