import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/_core/hooks/useAuth';
import { getLoginUrl } from '@/const';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, logout } = useAuth();

  const toggleMenu = () => setIsOpen(!isOpen);

  const navItems = [
    { label: '스타일 학습', href: '/learning' },
    { label: '자기소개서', href: '/writing' },
    { label: '면접 준비', href: '/interview' },
    { label: '히스토리', href: '/history' },
  ];

  return (
    <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-md z-50 border-b border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <a href="/" className="text-2xl font-bold text-accent">
              JasoS
            </a>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
              >
                <a className="text-foreground hover:text-accent transition-colors duration-200 font-medium">
                  {item.label}
                </a>
              </Link>
            ))}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <Button
                onClick={() => logout()}
                variant="outline"
                className="text-accent border-accent hover:bg-accent hover:text-white"
              >
                Logout
              </Button>
            ) : (
              <>
                <a href={getLoginUrl()}>
                  <Button
                    variant="outline"
                    className="text-accent border-accent hover:bg-accent hover:text-white"
                  >
                    Sign In
                  </Button>
                </a>
                <Link href="/writing">
                  <a className="cursor-pointer">
                    <Button className="bg-accent hover:bg-accent/90 text-white">
                      Get Started
                    </Button>
                  </a>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-accent hover:bg-gray-100"
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden pb-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
              >
                <a
                  className="block px-3 py-2 rounded-md text-foreground hover:bg-gray-100 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </a>
              </Link>
            ))}
            <div className="pt-2 space-y-2">
              {isAuthenticated ? (
                <Button
                  onClick={() => {
                    logout();
                    setIsOpen(false);
                  }}
                  variant="outline"
                  className="w-full text-accent border-accent"
                >
                  Logout
                </Button>
              ) : (
                <>
                  <a href={getLoginUrl()} className="block">
                    <Button
                      variant="outline"
                      className="w-full text-accent border-accent"
                    >
                      Sign In
                    </Button>
                  </a>
                  <Link href="/writing">
                    <a className="block">
                      <Button className="w-full bg-accent hover:bg-accent/90 text-white">
                        Get Started
                      </Button>
                    </a>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
