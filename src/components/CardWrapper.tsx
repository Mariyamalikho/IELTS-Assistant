import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';

interface CardWrapperProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}

export function CardWrapper({ 
  title, 
  description, 
  children, 
  footer,
  className = '',
  headerClassName = '',
  contentClassName = ''
}: CardWrapperProps) {
  return (
    <Card className={className}>
      {(title || description) && (
        <CardHeader className={headerClassName}>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className={contentClassName}>
        {children}
      </CardContent>
      {footer && (
        <CardFooter>
          {footer}
        </CardFooter>
      )}
    </Card>
  );
}
