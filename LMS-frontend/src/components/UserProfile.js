// import React from "react";
// import { Button, Modal} from "antd";
// import {Input}  from "antd";
// import { useState} from "react";

// const Profile = () => {
//   const [image, setimage] = useState("");
//   const [imagecrop, setimagecrop] = useState(false);
//   const [src, setsrc] = useState(false);
//   const [profile, setprofile] = useState([]);
//   const [pview, setpview] = useState(false);

//   const profileFinal = profile.map((item) => item.pview);

//   const onClose = () => {
//     setpview(null);
//   };

//   const onCrop = (view) => {
//     setpview(view);
//   };

//   const saveCropImage = () => {
//     setprofile([...profile, { pview }]);
//     setimagecrop(false);
//   };

//   return (
//     <div>
//     <div className="profile_img text-center p-4">
//       <div className="flex flex-column justify-content-center align-items-center">
//         <img
//           style={{
//             width: "200px",
//             height: "200px",
//             borderRadius: "50%",
//             objectFit: "cover",
//             border: "4px solid green",
//           }}
//           onClick={()=>setimagecrop(true)}

//           src={profileFinal.length ? profileFinal:img}
//           alt=""
//         />
//         <label htmlFor="" className="mt-3 font-semibold text-5xl">
//           Hello
//         </label>

//         <Modal
//           visible={imagecrop}
//           header={() => {
//             <p htmlFor="" className="text-2xl font-semibold textColor">
//               Update Profile
//             </p>;
//           }}
//           onHide={() => setimagecrop(false)}
//         >
//             <div className="confirmatiom-content flex flex-column align-items-center">
//                 <Modal
//                 width={500}
//                 height={400}
//                 onCrop={onCrop}
//                 onClose={onClose}
//                 src={src}
//                 shadingColor={"#474649"}
//                 backgroundColor={"#474649"}
//                 />
//                 <div className="flex flex-column align-items-center mt-5 w-12">
//                     <div className="flex justify-content-around w-12 mt-4">
//                         <Button
//                         onClick={saveCropImage}
//                         label="save"
//                         icon="pi pi-check"
//                         />
//                     </div>
//                 </div>
//             </div>
//         </Modal>

//         <Input
//           type="file"
//           accept="/image/*"
//           style={{display:"none"}}

//           onChange={(event) => {
//             const file = event.target.files[0];
//             if (file && file.type.substring(0, 5) === "image") {
//               setimage(file);
//             } else {
//               setimage(null);
//             }
//           }}
//         />
//       </div>
//     </div>
//     </div>
//   );
// };


// export default Profile