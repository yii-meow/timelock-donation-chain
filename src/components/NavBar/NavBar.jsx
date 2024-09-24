import React, {useEffect, useState, useContext} from "react";
import {Link} from "react-router-dom";


import Style from "./NavBar.module.css";
import {ChatAppContext} from "../../ChatAppContext";
import {Model, Error} from "../../chatappindex";
import images from "../../assets";


const NavBar = () => {
  const menuItems = [
    {
      menu: "All Users",
      link: "/chat/allusers"
    },
    {
      menu: "CHAT",
      link: "/chat/chat"
    },
    {
      menu: "CONTACT",
      link: "/chat"
    },
    {
      menu: "SETTING",
      link: "/chat"
    },
    {
      menu: "FAQS",
      link: "/chat"
    },
    {
      menu: "TERMS OF USE",
      link: "/chat"
    },
    {
      menu: "EXIT CHAT",
      link: "/dashboard"
    }
  ];

  //usestate
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const [openModel, setOpenModel] = useState(false);

  const{account, userName, connectWallet, createAccount, error} = useContext(ChatAppContext);

  return (
    <div className={Style.NavBar}>
      <div className={Style.NavBar_box}>
        <div className={Style.NavBar_box_left}>
          <img src={images.logo} alt="logo" width ={100} height={100}/>
        </div>
        <div className={Style.NavBar_box_right}>

        <div className={Style.NavBar_box_right_menu}>
        {menuItems.map((el, i) => (
          <div 
            onClick={() => setActive(i + 1)}
            key={i + 1} 
            className={`${Style.NavBar_box_right_menu_items}
                        ${active == i + 1 ? Style.active_btn : ""}
                      }`}
          >
            <Link 
              className={Style.NavBar_box_right_menu_items_link}
              to={el.link}
            >
              {el.menu}
            </Link>
          </div>
        ))}
      </div>
          
          {/*CONNECT WALLET*/}
          <div className={Style.NavBar_box_right_connect}>
            {account == ""? (
              <button onClick={()=> connectWallet()}>
                {""}
                <span>Connect Wallet</span>
              </button>
            ):(
              <button onClick={()=> setOpenModel(true)}>
                {""}
                <img src={userName ? images.accountName : images.create2}
                  alt="Acccount image"
                  width={20}
                  height={20}
                />
                {''}
                <small>{userName || "Create Account"}</small>
              </button>
            )}
          </div>

          <div 
            className={Style.NavBar_box_right_open}
            onClick={() => setOpen(true)}
          >
            <img src={images.open} alt="open" width={30} height={30}/>
          </div>
        </div>
      </div>

      {/*Model component */}
      {openModel &&(
        <div className={Style.modelBox}>
          <Model 
            openBox = {setOpenModel}
            title="Welcome to"
            head="DonationChain Chat"
            smallInfo="Please enter your detail here: "
            image = {images.hero}
            functionName = {createAccount}
            address={account}
          />
        </div>
      )}
      {error == "" ? "" : <Error error={error}/>}
    </div>
  );
};

export default NavBar;
