import React, { useState, useEffect } from 'react';
import {FiltersType} from "../helpers/db_helper";
import { filter } from 'motion/react-client';

export const CountUp: React.FC<{ filters: FiltersType }> = ( {filters} ) => {
    const [target, setTarget] = useState(0);
    const [count, setCount] = useState(0);
    async function fetchTotalEvents(filters: FiltersType) {
      const res = await fetch('/api/totalEvents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filters),
      });
      let totalEvents;
      if (res.ok) {
        totalEvents = await res.json();
        console.log(totalEvents)
      } else {
        totalEvents = 0
      }
      setTarget(totalEvents);
    }

    useEffect(() => {
      console.log(filters)
      setCount(0)
      fetchTotalEvents(filters);
      return () => {}
    }, [filters]);


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
      }, 0.001); // interval time (in milliseconds)
  
      return () => clearInterval(interval); // cleanup the interval when the component unmounts
    }, [target]);


  
    return (
        <>
            <div className="text-9xl font-bold pt-16 mt-20">
                {count}
            </div>
            <div className="text-gray-800 mt-3 text-xl">free food events happened at NTU!</div>
        </>
      
    );
  };