import React, { useState, useEffect, useContext } from "react";
import { useLocation } from 'react-router-dom';
import { ChatAppContext } from "../../../ChatAppContext";  // Adjust the import path as needed

import Style from "./Chat.module.css";
import images from "../../../assets";
import { convertTime } from "../../../apiFeature";
import { Loader } from "../../chatappindex";

const Chat = () => {
  const location = useLocation();
  const [message, setMessage] = useState('');
  const [chatData, setChatData] = useState({ name: "", address: "" });

  const {
    sendMessage,
    readMessage,
    friendMsg,
    account,
    userName,
    loading,
    currentUserName,
    currentUserAddress,
    error
  } = useContext(ChatAppContext);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const chatDataFromQuery = Object.fromEntries(queryParams.entries());
    setChatData(chatDataFromQuery);
    if (chatDataFromQuery.address) {
      readMessage(chatDataFromQuery.address);
    }
  }, [location, readMessage]);

  const handleSendMessage = async () => {
    if (message.trim() !== "") {
      try {
        await sendMessage({ msg: message, address: chatData.address });
        setMessage("");  // Clear the input after sending
        // Refresh messages
        readMessage(chatData.address);
      } catch (err) {
        console.error("Error sending message:", err);
      }
    }
  };

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
      ) : null}

      <div className={Style.Chat_box_box}>
        <div className={Style.Chat_box}>
          <div className={Style.Chat_box_left}>
            {friendMsg.map((el, i) => (
              <div key={i}>
                <div className={Style.Chat_box_left_title}>
                  <img src={images.accountName} alt="image" width={50} height={50}/>
                  <span>
                    {el.sender === chatData.address ? chatData.name : userName}{" "}
                    <small>(Time: {convertTime(el.timestamp)})</small>
                  </span>
                </div>
                <p>{el.msg}</p>
              </div>
            ))}
          </div>
        </div>
        {currentUserName && currentUserAddress ? (
          <div className={Style.Chat_box_send}>
            <div className={Style.Chat_box_send_img}>
              <img src={images.smile} alt="smile" width={50} height={50}/>
              <input
                type="text"
                placeholder="Say something here"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <img src={images.file} alt="file" width={50} height={50}/>
              {loading ? (
                <Loader />
              ) : (
                <img
                  src={images.send}
                  alt="send"
                  width={50}
                  height={50}
                  onClick={handleSendMessage}
                />
              )}
            </div>
          </div>
        ) : null}
      </div>
      {error && <p className={Style.error}>{error}</p>}
    </div>
  );
};

export default Chat;