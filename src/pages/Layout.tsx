import { Outlet, useNavigate } from 'react-router-dom'
import {
  Button,
  Link,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
} from '@heroui/react'
import CogIcon from '@heroicons/react/24/outline/CogIcon'
import assets_logo from '@/assets/logo.svg'

export default function Layout() {
  const navigate = useNavigate()
  return (
    <div className="bg-neutral-50 dark:bg-neutral-950">
      <Navbar isBordered maxWidth="full">
        <NavbarBrand
          className="cursor-pointer"
          onClick={() => {
            navigate('/')
          }}
        >
          <img
            src={assets_logo}
            className="w-8 h-8 transition-transform hover:rotate-180"
            alt="Transcript logo"
          />
          <p className="ml-2 font-bold text-inherit">Transcript</p>
        </NavbarBrand>
        <NavbarContent justify="end">
          <NavbarItem>
            <Button as={Link} href="#" isIconOnly variant="light">
              <CogIcon className="w-6 h-6" />
            </Button>
          </NavbarItem>
        </NavbarContent>
      </Navbar>
      <Outlet />
    </div>
  )
}
