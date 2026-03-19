import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/_core/hooks/useAuth';
import { getLoginUrl } from '@/const';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const toggleMenu = () => setIsOpen(!isOpen);

  const navItems = [
    { label: '스타일 학습', href: '/learning' },
    { label: '자기소개서', href: '/writing' },
    { label: '면접 준비', href: '/interview' },
    { label: '히스토리', href: '/history' },
  ];

  const navigate = (href: string) => {
    setLocation(href);
    setIsOpen(false);
  };

  return (
    <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-md z-50 border-b border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <button
              onClick={() => navigate("/")}
              className="text-2xl font-bold text-accent bg-transparent border-none cursor-pointer p-0"
            >
              JasoS
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(item.href)}
                className="text-foreground hover:text-accent transition-colors duration-200 font-medium bg-transparent border-none cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Button
                  onClick={() => navigate('/my')}
                  variant="ghost"
                  className="text-foreground hover:bg-gray-100 mr-2 font-semibold"
                >
                  {(user as any)?.username || user?.name || 'My Page'}
                </Button>
                <Button
                  onClick={() => logout()}
                  variant="outline"
                  className="text-accent border-accent hover:bg-accent hover:text-white"
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => navigate(getLoginUrl())}
                  variant="outline"
                  className="text-accent border-accent hover:bg-accent hover:text-white"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => navigate('/writing')}
                  className="bg-accent hover:bg-accent/90 text-white"
                >
                  Get Started
                </Button>
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
              <button
                key={item.label}
                onClick={() => navigate(item.href)}
                className="block w-full text-left px-3 py-2 rounded-md text-foreground hover:bg-gray-100 transition-colors bg-transparent border-none cursor-pointer"
              >
                {item.label}
              </button>
            ))}
            <div className="pt-2 space-y-2">
              {isAuthenticated ? (
                <>
                  <Button
                    onClick={() => {
                      navigate('/my');
                    }}
                    variant="ghost"
                    className="w-full text-foreground justify-start mb-2 font-semibold"
                  >
                    {(user as any)?.username || user?.name || 'My Page'}
                  </Button>
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
                </>
              ) : (
                <>
                  <Button
                    onClick={() => navigate(getLoginUrl())}
                    variant="outline"
                    className="text-accent border-accent hover:bg-accent hover:text-white"
                  >
                    Sign In
                  </Button>
                  <Button
                    onClick={() => navigate('/writing')}
                    className="w-full bg-accent hover:bg-accent/90 text-white"
                  >
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
