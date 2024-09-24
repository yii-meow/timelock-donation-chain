import React, {useEffect, useState, useContext} from "react";
import {Link} from "react-router-dom";


import Style from "./NavBar.module.css";
import {ChatAppContext} from "../../ChatAppContext";
import {Error} from "../chatappindex";
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

  const{account, userName, connectWallet, error} = useContext(ChatAppContext);

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

          <div 
            className={Style.NavBar_box_right_open}
            onClick={() => setOpen(true)}
          >
            <img src={images.open} alt="open" width={30} height={30}/>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavBar;
