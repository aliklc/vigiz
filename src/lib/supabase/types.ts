export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
	public: {
		Tables: {
			answers: {
				Row: {
					answered_at: string;
					choice_index: number;
					game_id: string;
					player_id: string;
					points: number;
					question_id: string;
				};
				ComputedFields: never;
				Insert: {
					answered_at?: string;
					choice_index: number;
					game_id: string;
					player_id: string;
					points: number;
					question_id: string;
				};
				Update: {
					answered_at?: string;
					choice_index?: number;
					game_id?: string;
					player_id?: string;
					points?: number;
					question_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'answers_game_id_fkey';
						columns: ['game_id'];
						isOneToOne: false;
						referencedRelation: 'games';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'answers_player_id_fkey';
						columns: ['player_id'];
						isOneToOne: false;
						referencedRelation: 'game_scores';
						referencedColumns: ['player_id'];
					},
					{
						foreignKeyName: 'answers_player_id_fkey';
						columns: ['player_id'];
						isOneToOne: false;
						referencedRelation: 'players';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'answers_question_id_fkey';
						columns: ['question_id'];
						isOneToOne: false;
						referencedRelation: 'questions';
						referencedColumns: ['id'];
					},
				];
			};
			games: {
				Row: {
					code: string;
					created_at: string;
					current_index: number;
					finished_at: string | null;
					id: string;
					paused_at: string | null;
					phase: string;
					question_started_at: string | null;
					quiz_id: string;
				};
				ComputedFields: never;
				Insert: {
					code: string;
					created_at?: string;
					current_index?: number;
					finished_at?: string | null;
					id?: string;
					paused_at?: string | null;
					phase?: string;
					question_started_at?: string | null;
					quiz_id: string;
				};
				Update: {
					code?: string;
					created_at?: string;
					current_index?: number;
					finished_at?: string | null;
					id?: string;
					paused_at?: string | null;
					phase?: string;
					question_started_at?: string | null;
					quiz_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'games_quiz_id_fkey';
						columns: ['quiz_id'];
						isOneToOne: false;
						referencedRelation: 'quizzes';
						referencedColumns: ['id'];
					},
				];
			};
			player_tokens: {
				Row: {
					player_id: string;
					token: string;
				};
				ComputedFields: never;
				Insert: {
					player_id: string;
					token?: string;
				};
				Update: {
					player_id?: string;
					token?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'player_tokens_player_id_fkey';
						columns: ['player_id'];
						isOneToOne: true;
						referencedRelation: 'game_scores';
						referencedColumns: ['player_id'];
					},
					{
						foreignKeyName: 'player_tokens_player_id_fkey';
						columns: ['player_id'];
						isOneToOne: true;
						referencedRelation: 'players';
						referencedColumns: ['id'];
					},
				];
			};
			players: {
				Row: {
					game_id: string;
					id: string;
					joined_at: string;
					name: string;
				};
				ComputedFields: never;
				Insert: {
					game_id: string;
					id: string;
					joined_at?: string;
					name: string;
				};
				Update: {
					game_id?: string;
					id?: string;
					joined_at?: string;
					name?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'players_game_id_fkey';
						columns: ['game_id'];
						isOneToOne: false;
						referencedRelation: 'games';
						referencedColumns: ['id'];
					},
				];
			};
			questions: {
				Row: {
					choices: string[];
					correct_index: number;
					explanation: string | null;
					id: string;
					image_url: string | null;
					position: number;
					quiz_id: string;
					text: string;
				};
				ComputedFields: never;
				Insert: {
					choices: string[];
					correct_index: number;
					explanation?: string | null;
					id?: string;
					image_url?: string | null;
					position: number;
					quiz_id: string;
					text: string;
				};
				Update: {
					choices?: string[];
					correct_index?: number;
					explanation?: string | null;
					id?: string;
					image_url?: string | null;
					position?: number;
					quiz_id?: string;
					text?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'questions_quiz_id_fkey';
						columns: ['quiz_id'];
						isOneToOne: false;
						referencedRelation: 'quizzes';
						referencedColumns: ['id'];
					},
				];
			};
			quizzes: {
				Row: {
					author_name: string;
					created_at: string;
					id: string;
					owner_id: string;
					quiz_date: string;
					status: string;
					time_limit_sec: number;
					title: string;
					topic: string;
				};
				ComputedFields: never;
				Insert: {
					author_name: string;
					created_at?: string;
					id?: string;
					owner_id: string;
					quiz_date: string;
					status?: string;
					time_limit_sec?: number;
					title: string;
					topic: string;
				};
				Update: {
					author_name?: string;
					created_at?: string;
					id?: string;
					owner_id?: string;
					quiz_date?: string;
					status?: string;
					time_limit_sec?: number;
					title?: string;
					topic?: string;
				};
				Relationships: [];
			};
		};
		Views: {
			answer_points: {
				Row: {
					answered_at: string;
					choice_index: number;
					game_id: string;
					player_id: string;
					points: number;
					question_id: string;
					total: number | null;
				};
				ComputedFields: never;
				Relationships: [
					{
						foreignKeyName: 'answers_game_id_fkey';
						columns: ['game_id'];
						isOneToOne: false;
						referencedRelation: 'games';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'answers_player_id_fkey';
						columns: ['player_id'];
						isOneToOne: false;
						referencedRelation: 'game_scores';
						referencedColumns: ['player_id'];
					},
					{
						foreignKeyName: 'answers_player_id_fkey';
						columns: ['player_id'];
						isOneToOne: false;
						referencedRelation: 'players';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'answers_question_id_fkey';
						columns: ['question_id'];
						isOneToOne: false;
						referencedRelation: 'questions';
						referencedColumns: ['id'];
					},
				];
			};
			game_scores: {
				Row: {
					game_id: string;
					name: string;
					player_id: string;
					score: number | null;
				};
				ComputedFields: never;
				Relationships: [
					{
						foreignKeyName: 'players_game_id_fkey';
						columns: ['game_id'];
						isOneToOne: false;
						referencedRelation: 'games';
						referencedColumns: ['id'];
					},
				];
			};
		};
		Functions: {
			save_quiz: { Args: { p_id: string; p_owner: string; p_quiz: Json }; Returns: string };
		};
		Enums: {
			[_ in never]: never;
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
	DefaultSchemaTableNameOrOptions extends
		| keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
				DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
		: never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
	? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
			DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
			Row: infer R;
		}
		? R
		: never
	: DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
				DefaultSchema['Views'])
		? (DefaultSchema['Tables'] &
				DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
				Row: infer R;
			}
			? R
			: never
		: never;

export type TablesInsert<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema['Tables']
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
		: never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
			Insert: infer I;
		}
		? I
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
		? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
				Insert: infer I;
			}
			? I
			: never
		: never;

export type TablesUpdate<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema['Tables']
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
		: never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
			Update: infer U;
		}
		? U
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
		? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
				Update: infer U;
			}
			? U
			: never
		: never;

export type Enums<
	DefaultSchemaEnumNameOrOptions extends
		| keyof DefaultSchema['Enums']
		| { schema: keyof DatabaseWithoutInternals },
	EnumName extends DefaultSchemaEnumNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
		: never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
	? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
	: DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
		? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
		: never;

export type CompositeTypes<
	PublicCompositeTypeNameOrOptions extends
		| keyof DefaultSchema['CompositeTypes']
		| { schema: keyof DatabaseWithoutInternals },
	CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
		: never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
	? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
	: PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
		? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
		: never;

export const Constants = {
	public: {
		Enums: {},
	},
} as const;
