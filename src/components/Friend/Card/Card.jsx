import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { ChatAppContext } from "../../../ChatAppContext";  // Adjust the import path as needed

import Style from "./Card.module.css";
import images from "../../../assets";

const Card = ({ el, i }) => {
  const { readMessage, readUser } = useContext(ChatAppContext);

  const handleClick = () => {
    readMessage(el.pubkey);
    readUser(el.pubkey);
  };

  return (
    <Link to={{
      pathname: "/chat/chat",
      search: `?name=${encodeURIComponent(el.name)}&address=${encodeURIComponent(el.pubkey)}`
    }}>
      <div className={Style.Card} onClick={handleClick}>
        <div className={Style.Card_box}>
          <div className={Style.Card_box_left}>
            <img
              src={images.accountName}
              alt="username"
              width={50}
              height={50}
              className={Style.Card_box_left_img}
            />
          </div>

          <div className={Style.Card_box_right}>
            <div className={Style.Card_box_right_middle}>
              <h4>{el.name}</h4>
              <small>{el.pubkey.slice(0, 21)}..</small>
            </div>

            <div className={Style.Card_box_right_end}>
              <small>{i + 1}</small>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default Card;