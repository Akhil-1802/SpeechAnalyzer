import express, { Request, Response } from 'express'
import {createClient} from 'redis'
import cors from 'cors'
import { generateRandomString } from './utils'
const publisher =  createClient()
publisher.connect()
const app = express()
app.use(express.json())
app.use(express.urlencoded({extended : true}))
app.use(cors())


app.post('/topic' , (req : Request , res : Response) => {
    try {
      const { topic } = req.body;
      if(!topic) return res.status(300).json({message : "Topic is required"})
      console.log(topic)
      const id = generateRandomString();
      publisher.lPush('topic' , JSON.stringify({id , topic}))
      res.status(200)
    } catch (error) {
        console.log(error)
        res.status(500).json({
          message:"Internal server error"
        })
    }
})


app.listen(3000, () => {
  console.log('Server is running on port 3000')
})