import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash, Star } from "lucide-react";
import { fadeIn, cardHover } from "@/lib/animations";
import { format } from "date-fns";

interface Source {
  id: string;
  name: string;
  description: string | null;
  type: string;
  created_at: string;
  updated_at: string;
}

interface SourceListProps {
  sources: Source[];
  loading: boolean;
  onSourceChange: () => void;
}

const SourceList: React.FC<SourceListProps> = ({ sources, loading, onSourceChange }) => {
  if (sources.length === 0 && !loading) {
    return (
      <div className="text-center py-12 px-4">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No sources yet</h3>
        <p className="text-gray-600 mb-8">Create your first source to start organizing your traffic sources.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
      {sources.map((source) => (
        <motion.div
          key={source.id}
          variants={fadeIn}
          whileHover="hover"
          initial="rest"
          animate="rest"
        >
          <motion.div variants={cardHover}>
            <Card className="border border-gray-200 rounded-lg overflow-hidden h-full">
              <CardContent className="p-0">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 truncate">{source.name}</h3>
                    <Badge variant={source.type === 'utm' ? 'default' : 'outline'}>
                      {source.type}
                    </Badge>
                  </div>
                  
                  {source.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{source.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                    <div className="text-gray-500 text-sm">
                      Created {format(new Date(source.created_at), 'MMM d, yyyy')}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Star className="h-4 w-4 text-gray-500" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Edit className="h-4 w-4 text-gray-500" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Trash className="h-4 w-4 text-gray-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
};

export default SourceList; 