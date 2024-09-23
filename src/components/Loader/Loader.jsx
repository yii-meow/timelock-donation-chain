import React from "react";

import images from '../../assets';
import Styles from './Loader.module.css';

const Loader = () => {
  return (
    <div className={Styles.Loader}>
      <div className={Styles.Loader_box}>
        <img src={images.loader} alt="loader" width={100} height={100}/>
      </div>
    </div>
  );
};

export default Loader;
