import React from 'react';

export default (props) => {
  const { dot } = props;
  const style = {
    left: `${dot[0]}%`,
    top: `${dot[1]}%`,
  };
  return (
    <div>
      <div className="food-dot" key="food" style={style}></div>
    </div>
  )
}