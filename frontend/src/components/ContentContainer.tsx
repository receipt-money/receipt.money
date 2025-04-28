import { FC } from 'react';
import Link from "next/link";
import Text from './Text';
import NavElement from './nav-element';
interface Props {
  children: React.ReactNode;
}

export const ContentContainer: React.FC<Props> = ({ children }) => {

  return (
    <div className="drawer">
      <input id="my-drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content overflow-y-auto">
        <main className="flex-1">
          {children}
        </main>
      </div>
      {/* SideBar / Drawer */}
      <div className="drawer-side">
        <label htmlFor="my-drawer" className="drawer-overlay"></label>
        <aside className="bg-base-100 w-80">
          <ul className="menu p-4 gap-4">
            <li>
              <Text variant="heading" className='font-extrabold tracking-tighter text-center text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-fuchsia-500 mt-4'>Menu</Text>
            </li>
            <li>
              <NavElement
                label="Home"
                href="/"
              />
            </li>
            <li>
              <NavElement
                label="Deposit"
                href="/deposit"
              />
            </li>
          </ul>
        </aside>
      </div>
    </div>
  );
};