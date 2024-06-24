import React from 'react'
import Link from 'next/link';


const Navbar = () => {
  return (
    <div className='navbar'>
      <Link href='/' className='navbar-button'>Home</Link>
      <Link href='/about' className='navbar-button'>About</Link>
      <Link href='/download' className='navbar-button'>Download</Link>
    </div>
  )
}

export default Navbar
