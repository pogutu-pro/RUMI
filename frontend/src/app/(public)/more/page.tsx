import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Info,
  HelpCircle,
  Mail,
  FileText,
  Shield,
  Briefcase,
  Download,
  Phone,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'More',
  description: 'Explore more RumiaRent features, help resources, and information',
};

interface MenuItemProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  external?: boolean;
}

function MenuItem({ href, icon, title, description, external }: MenuItemProps) {
  return (
    <Link 
      href={href}
      {...(external && { target: '_blank', rel: 'noopener noreferrer' })}
    >
      <Card className="p-5 hover:shadow-md hover:border-primary/20 transition-all cursor-pointer group">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-primary/10 p-3 group-hover:bg-primary/20 transition-colors">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-primary transition-colors">
              {title}
            </h3>
            <p className="text-sm text-gray-600 line-clamp-2">{description}</p>
          </div>
        </div>
      </Card>
    </Link>
  );
}

export default function MorePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">More</h1>
          <p className="text-gray-600">
            Explore additional features and resources
          </p>
        </div>

        {/* About & Information Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">
            About RumiaRent
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <MenuItem
              href="/about"
              icon={<Info className="h-6 w-6 text-primary" />}
              title="About Us"
              description="Learn more about RumiaRent and our mission"
            />
            <MenuItem
              href="/how-it-works"
              icon={<HelpCircle className="h-6 w-6 text-primary" />}
              title="How It Works"
              description="Understand how RumiaRent simplifies rent collection"
            />
            <MenuItem
              href="/features"
              icon={<Briefcase className="h-6 w-6 text-primary" />}
              title="Features"
              description="Discover all RumiaRent platform features"
            />
            <MenuItem
              href="/pricing"
              icon={<FileText className="h-6 w-6 text-primary" />}
              title="Pricing"
              description="View our transparent pricing plans"
            />
          </div>
        </div>

        {/* Help & Support Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Help \u0026 Support
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <MenuItem
              href="/faq"
              icon={<HelpCircle className="h-6 w-6 text-primary" />}
              title="FAQ"
              description="Find answers to common questions"
            />
            <MenuItem
              href="/contact"
              icon={<Mail className="h-6 w-6 text-primary" />}
              title="Contact Us"
              description="Get in touch with our support team"
            />
            <MenuItem
              href="tel:+254700000000"
              icon={<Phone className="h-6 w-6 text-primary" />}
              title="Call Us"
              description="Speak to our customer service"
              external
            />
            <MenuItem
              href="/blog"
              icon={<FileText className="h-6 w-6 text-primary" />}
              title="Blog"
              description="Read our latest news and tips"
            />
          </div>
        </div>

        {/* Legal Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Legal</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <MenuItem
              href="/terms"
              icon={<FileText className="h-6 w-6 text-primary" />}
              title="Terms of Service"
              description="Read our terms and conditions"
            />
            <MenuItem
              href="/privacy"
              icon={<Shield className="h-6 w-6 text-primary" />}
              title="Privacy Policy"
              description="Learn how we protect your data"
            />
          </div>
        </div>

        {/* App Download Section */}
        <Card className="p-8 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <div className="text-center space-y-4">
            <Download className="h-12 w-12 text-primary mx-auto" />
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-gray-900">
                Download the RumiaRent App
              </h3>
              <p className="text-gray-600">
                Get the best rent management experience on your mobile device
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button size="lg" className="gap-2">
                <Download className="h-5 w-5" />
                Coming Soon
              </Button>
            </div>
          </div>
        </Card>

        {/* Footer Info */}
        <div className="text-center pt-6 pb-8 text-sm text-gray-600">
          <p>© 2024 RumiaRent. All rights reserved.</p>
          <p className="mt-2">
            Built and managed by{' '}
            <a
              href="https://www.stratnovo.co.ke/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-gray-700 transition-colors"
            >
              Stratnovo
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
