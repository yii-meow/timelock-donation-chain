import React,{useState,useContext} from "react";

import Style from './Model.module.css';
import images from "../../assets";
import {ChatAppContext} from '../../ChatAppContext';
import {Loader} from '../../chatappindex';

const Model = ({openBox, title, head, info, smallInfo, image, functionName, address}) => {
  
  //usestate
  const [name, setName] = useState('');
  const [accountAddress, setAccountAddress] = useState('');

  const {loading} = useContext(ChatAppContext);

  return (
    <div className= {Style.Model}>
      <div className= {Style.Model_box}>
        <div className={Style.Model_box_left}>
          <img src={image} alt="buddy" width={700} height={700}/>
        </div>
        <div className={Style.Model_box_right}>
          <h1>
            {title} <span>{head}</span>
          </h1>
          <p>{info}</p>
          <small>{smallInfo}</small>
          
          {
            loading == true ? (
              <Loader/>
            ) :(
              <div className={Style.Model_box_right_name}>
            <div className={Style.Model_box_right_name_info}>
              <img src={images.username} alt="send" width={30} height={30}/>
              <input
                type="text"
                placeholder="Your Name"
                onChange={(e) => setName(e.target.value)}
              />
              </div>
              <div className={Style.Model_box_right_name_info}>
                <img src={images.account} alt="user" width={30} height={30}/>
                <input 
                  type="text"
                  placeholder={address || "Enter Address...."}
                  onChange={(e) => setAccountAddress(e.target.value)}
                />
            </div>

            <div className={Style.Model_box_right_name_btn}>
              <button onClick={()=> functionName({name, accountAddress})}>
                {""}
                <img src={images.send} alt="send" width={30} height={30}/>
                {""}
                Submit
              </button>

              <button onClick={()=> openBox(false)}>
                {""}
                <img src={images.close} alt="send" width={30} height={30}/>
                {""}
                Cancel
              </button>
            </div>
          </div>
            )
          }

          
        </div>
      </div>
    </div>
  );
};

export default Model;
