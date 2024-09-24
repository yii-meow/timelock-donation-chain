import React, {useState, useContext} from "react";

import Style from "./Filter.module.css";
import images from "../../assets";
import { ChatAppContext } from "../../ChatAppContext";
import {Model,Friend} from "../chatappindex";

const Filter = () => {

  const {account, addFriends} = useContext(ChatAppContext);

  //usestate
  const [addFriend, setAddFriend] = useState(false);

  return (
    <div>
      <div className={Style.Filter}>
        <div className={Style.Filter_box}>
          <div className={Style.Filter_box_left}>
            <div className={Style.Filter_box_left_search}>
              <img src={images.search} alt="image" width={20} height={20}/>
              <input type="text" placeholder="Let's search for friends.."/>
            </div>
          </div>
          <div className={Style.Filter_box_right}>
            <button>
              <img src={images.clear} alt="clear" width={20} height={20}/>
              CLEAR YOUR CHAT
            </button>
            <button onClick={()=> setAddFriend(true)}>
              <img src={images.create2} alt="clear" width={20} height={20}/>
              ADD YOUR FRIEND
            </button>
          </div>
        </div>

        {addFriend && (
          <div className={Style.Filter_model}>
            <Model openBox={setAddFriend}
              title="WELCOME TO"
              head="DonationChain Chat"
              smallInfo="Let's Enter Your Friend Name and Address.."
              image = {images.hero}
              functionName = {addFriends}
            />

          </div>
        )}
      </div>
      <div><Friend/></div>
    </div>
  );
};

export default Filter;
