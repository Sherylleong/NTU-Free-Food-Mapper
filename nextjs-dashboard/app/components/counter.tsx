import React, { useState, useEffect } from 'react';

export const CountUp: React.FC<{ target: number}> = ({target}) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
      const interval = setInterval(() => {
        setCount((prevCount) => {
          if (prevCount < target) {
            return prevCount + 1;
          } else {
            clearInterval(interval); // stop when target is reached
            return target;
          }
        });
      }, 10); // adjust the speed by changing the interval time (in milliseconds)
  
      return () => clearInterval(interval); // cleanup the interval when the component unmounts
    }, []);
  
    return (
        <>
            <div className="text-9xl font-bold pt-12">
                {count}
            </div>
            <div className="text-gray-800 mt-3 text-xl">free food events happened at NTU!</div>
        </>
      
    );
  };