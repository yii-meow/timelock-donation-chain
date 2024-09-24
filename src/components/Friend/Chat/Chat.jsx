import React, {useState, useEffect} from "react";
import { useNavigate, useLocation } from 'react-router-dom';

import Style from "./Chat.module.css";
import images from "../../../assets";
import { convertTime } from "../../../apiFeature";
import { Loader } from "../../../chatappindex";


const Chat = ({functionName, readMessage, friendMsg, account, userName, loading, currentUserName, currentUserAddress}) => {
  const location = useLocation();
  //usestate
  const [message, setMessage] = useState('');
  const [chatData, setChatData] = useState({name:"", address:""});

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const chatDataFromQuery = Object.fromEntries(queryParams.entries());
    setChatData(chatDataFromQuery);

  }, [location]);

  //console.log(chatData.address, chatData.name);

  return (
    <div className={Style.Chat}>
      {currentUserName && currentUserAddress ? (
        <div className={Style.Chat_user_info}> 
          <img src={images.accountName} alt="image" width={70} height={70}/>

          <div className={Style.Chat_user_info_box}>
            <h4>{currentUserName}</h4>
            <p className={Style.show}> {currentUserAddress} </p>
          </div>

        </div>
      ): ("")}

      <div className={Style.Chat_box_box}>
        <div className={Style.Chat_box}>
          <div className={Style.Chat_box_left}>
            {
              friendMsg.map((el,i)=>(
                <div>
                  {el.sender == chatData.address ?(
                    <div className={Style.Chat_box_left_title}>
                      <img src={images.accountName} alt="image" width={50} height={50}/>
                      <span>
                        {chatData.name}{" "}
                        <small>(Time: {convertTime(el.timestamp)})</small>
                      </span>
                    </div>
                  ):(
                    <div className={Style.Chat_box_left_title}>
                      <img src={images.accountName} alt="image" width={50} height={50}/>
                      <span>
                        {userName}{" "}
                        <small>(Time: {convertTime(el.timestamp)})</small>
                      </span>
                    </div>
                  )}
                  <p key={i+1}>
                    {el.msg}
                    {""}
                    {""}
                  </p>
                </div>
              ))}
          </div>
        </div>

        {currentUserName && currentUserAddress ? (
          <div className={Style.Chat_box_send}>
            <div className={Style.Chat_box_send_img}>
              <img src={images.smile} alt="smile" width={50} height={50}/>
              <input type="text" placeholder="Say something here"
               onChange={(e) => setMessage(e.target.value)}
              />
              <img src={images.file} alt="file" width={50} height={50}/>
              {
                loading == true ?(
                  <Loader/>
                ) : (
                  <img src={images.send} alt="file" width={50} height={50}
                    onClick={()=> functionName({msg: message, address: chatData.address})}/>
                )}
            </div>
          </div>
        ):("")}
      </div>
    </div>
  );
};

export default Chat;
