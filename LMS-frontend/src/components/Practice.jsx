import React from 'react'
import axios from "axios";
import { useState } from 'react';

const Practice = () => {
const [image,setImage] = useState();

    const handleChange =(e)=>{
        // console.log(e.target.files)
        setImage(e.target.files[0])
    }
    const handleAPI=()=>{
        const url="https://v2.convertapi.com/upload "
        const formData=new FormData()
        formData.append("image",image)
        axios.post(url,formData).then((res)=>{
            // console.log(res.data)
            // console.log(formData,"Formdata")
            // console.log(url,"URL")
        }).catch((err)=>{
            // console.log(err)
        })
    }
  return (
    <div>
        <input type="file" onChange={handleChange}/>
        <button onClick={handleAPI}>Submit</button>
    </div>
  )
}

export default Practice;

